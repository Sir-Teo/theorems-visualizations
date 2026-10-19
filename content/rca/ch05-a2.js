// Rudin, Real and Complex Analysis — Chapter 5, part 2: consequences of Baire's theorem (5.8–5.11).

// ‖D_N‖_1 = (1/2π)∫|D_N| (Rudin's normalisation dm = dt/2π), computed with Simpson's rule.
const LEB = [];
function lebesgue(M, N) {
  if (LEB[N] != null) return LEB[N];
  const n = 400 + 80 * N;
  LEB[N] = M.integrate((t) => Math.abs(M.dirichlet(N, t)), 0, Math.PI, n) / Math.PI;
  return LEB[N];
}

// vertices (with preimages) of the image of the unit ball of ℓ^p(R^3) under the 2×3 matrix with columns a
function imageVertices(a, p) {
  const pre = [];
  if (p === 1) for (let i = 0; i < 3; i++) for (const s of [1, -1]) { const x = [0, 0, 0]; x[i] = s; pre.push(x); }
  else for (const s0 of [1, -1]) for (const s1 of [1, -1]) for (const s2 of [1, -1]) pre.push([s0, s1, s2]);
  return pre.map((x) => ({ x, y: [a[0][0] * x[0] + a[1][0] * x[1] + a[2][0] * x[2], a[0][1] * x[0] + a[1][1] * x[1] + a[2][1] * x[2]] }));
}

export default {
  collection: 'rca',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8',
      kind: 'Theorem',
      name: 'Banach–Steinhaus theorem',
      credit: 'Banach & Steinhaus, 1927',
      statement: String.raw`Let $X$ be a Banach space, $Y$ a normed linear space, and $\{\Lambda_\alpha\}_{\alpha\in A}$ any collection of bounded linear transformations of $X$ into $Y$. Then either
(a) there is $M<\infty$ with $\norm{\Lambda_\alpha}\le M$ for every $\alpha\in A$, or
(b) $\sup_{\alpha\in A}\norm{\Lambda_\alpha x}=\infty$ for every $x$ in some dense $G_\delta$ subset of $X$.`,
      idea: String.raw`Put $\varphi(x)=\sup_\alpha\norm{\Lambda_\alpha x}$; as a supremum of continuous functions it is lower semicontinuous, so $V_n=\{\varphi>n\}$ is open. If some $V_N$ fails to be dense, $\varphi\le N$ on a ball $\norm{x-x_0}<r$, and linearity converts this into $\norm{\Lambda_\alpha}\le 2N/r$ for all $\alpha$. Otherwise every $V_n$ is dense and open, Baire's theorem (5.6) makes $\bigcap_n V_n$ a dense $G_\delta$, and $\varphi=\infty$ there.`,
      caption: String.raw`$X=C[0,1]$. Drag the four points that define a smooth $g$ and add $\eps\,x^{1/4}$ (a perturbation of sup-norm $\eps$). The averages $\Lambda_nf=n\int_0^{1/n}f$ all have norm $1$: every orbit stays below $\norm{f}_\infty$. The difference quotients $\Lambda_nf=n\,(f(1/n)-f(0))$ have $\norm{\Lambda_n}=2n\to\infty$; smooth $g$ still has a bounded orbit, but the orbit of $g+\eps x^{1/4}$ blows up for every $\eps>0$ — the unbounded orbits are dense, as alternative (b) says.`,
      deps: ['rca-5.6', 'rca-5.7', 'rca-5.3', 'rca-5.2'],
      see: ['fa-2.5', 'fa-2.6'],
      tags: ['uniform boundedness', 'Baire category'],
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'avg', label: '$\\Lambda_nf=n\\int_0^{1/n}f$' }, { value: 'dq', label: '$\\Lambda_nf=n\\,(f(\\frac1n)-f(0))$' }], 'dq');
        const epsS = v.slider('$\\varepsilon$', 0, 0.3, 0.12, { step: 0.005 });
        const NS = v.slider('$n\\le$', 20, 400, 300, { int: true });
        const top = v.stage({ x: [-0.03, 1.03], y: [-0.42, 1.3], height: 240, full: true, axes: 'box', title: '$g$ (smooth) and $f=g+\\varepsilon\\,x^{1/4}$ — within $\\varepsilon$ of $g$' });
        const bot = v.stage({ x: [0, 400], y: [0, 1], height: 220, full: true, axes: 'box', title: 'orbits $|\\Lambda_n g|$ and $|\\Lambda_n f|$' });
        const XS = [0, 1 / 3, 2 / 3, 1];
        const H = [[0, 0.3], [1 / 3, 0.5], [2 / 3, 0.25], [1, 0.6]].map(([x, y]) => top.handle(x, y, { color: 'ink', r: 6, constrain: (xx, yy) => [x, M.clamp(yy, -0.6, 1.1)] }));
        let st = null;
        v.render(() => {
          const g = M.lagrange(XS, H.map((h) => h.y));
          const e = epsS.value, Nmax = NS.value, m = mode.value;
          const f = (x) => g(x) + e * Math.pow(x, 0.25);
          top.between((x) => g(x) + e, (x) => g(x) - e, 0, 1, { fill: 'accent', fillAlpha: 0.1 });
          top.fn(g, { domain: [0, 1], color: 'ink', width: 2.2 });
          top.fn(f, { domain: [0, 1], color: 'gold', width: 2.2, n: 1200 });
          top.tex('g', 0.5, g(0.5), { color: 'ink', baseline: 'top', dy: 8 });
          top.tex('f', 0.08, f(0.08), { color: 'gold', baseline: 'bottom', dy: -8 });
          // orbits
          const Lg = [], Lf = [];
          for (let n = 1; n <= Nmax; n++) {
            let a, b;
            if (m === 'dq') { a = n * (g(1 / n) - g(0)); b = a + e * Math.pow(n, 0.75); }
            else { a = n * M.integrate(g, 0, 1 / n, 16); b = a + e * 0.8 * Math.pow(n, -0.25); }
            Lg.push([n, Math.abs(a)]); Lf.push([n, Math.abs(b)]);
          }
          const fsup = Math.max(...M.linspace(0, 1, 201).map((x) => Math.abs(f(x))));
          const gsup = Math.max(...M.linspace(0, 1, 201).map((x) => Math.abs(g(x))));
          const ymax = Math.max(m === 'avg' ? fsup : 0, ...Lf.map((p) => p[1]), ...Lg.map((p) => p[1])) * 1.15 + 0.05;
          bot.setView([0, Nmax * 1.02], [-0.14 * ymax, ymax]);
          if (m === 'avg') {
            bot.hline(fsup, { color: 'gold', dash: [5, 4], width: 1.2 });
            bot.text('‖Λₙ‖·‖f‖∞ = ‖f‖∞', Nmax * 0.98, fsup, { align: 'right', dy: -9, color: 'gold', size: 12 });
          }
          bot.path(Lg, { color: 'ink', width: 2 });
          bot.path(Lf, { color: 'gold', width: 2.4 });
          bot.corner(m === 'avg' ? 'alternative (a): sup ‖Λₙ‖ = 1' : 'alternative (b): ‖Λₙ‖ = 2n → ∞', 'tl', { color: m === 'avg' ? 'green' : 'red', weight: 600 });
          st = { m, e, Nmax, g: Lg[Nmax - 1][1], f: Lf[Nmax - 1][1], gmax: Math.max(...Lg.map((p) => p[1])), fsup, gsup };
        });
        v.legend([['ink', 'smooth $g$ and its orbit'], ['gold', '$f=g+\\varepsilon x^{1/4}$ and its orbit'], ['accent', '$\\varepsilon$-band about $g$', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const head = `$\\|f-g\\|_\\infty=\\varepsilon=${v.fix(st.e, 3)}$; at $n=${st.Nmax}$: $|\\Lambda_ng| = ${v.fmt(st.g, 3)}$, $|\\Lambda_nf| = ${v.fmt(st.f, 3)}$. `;
          return head + (st.m === 'avg' ? 'Every orbit stays below $\\|f\\|_\\infty$.' : (st.e > 0 ? `The orbit of $f$ grows like $\\varepsilon n^{3/4}$, while $\\sup_n|\\Lambda_n g| \\le \\|g'\\|_\\infty$.` : 'With $\\varepsilon=0$ the orbit of the smooth $g$ stays bounded.'));
        });
      },
    },
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Theorem',
      name: 'Open mapping theorem',
      credit: 'Banach, 1929',
      statement: String.raw`Let $X$ and $Y$ be Banach spaces with open unit balls $U$ and $V$, and let $\Lambda:X\to Y$ be a bounded linear transformation **onto** $Y$. Then there is $\delta>0$ such that
$$\Lambda(U)\supset\delta V .$$
Consequently $\Lambda$ maps open sets of $X$ to open sets of $Y$.`,
      idea: String.raw`$Y=\bigcup_k\Lambda(kU)$, so by Baire's theorem (5.6) some $\overline{\Lambda(kU)}$ has interior, and symmetry plus convexity give $\overline{\Lambda(U)}\supset 2\delta V$. To remove the closure, approximate $y\in\delta V$ by $\Lambda x_1$, then the error by $\Lambda x_2$ with $\norm{x_2}<\tfrac12$, and so on; completeness of $X$ makes $\sum x_k$ converge to an $x$ with $\norm{x}<1$ and $\Lambda x=y$.`,
      caption: String.raw`A concrete instance: $\Lambda:\R^3\to\R^2$ with columns $\Lambda e_1,\Lambda e_2,\Lambda e_3$ (drag them), the $\ell^p$ norm on $\R^3$ and the Euclidean norm on $\R^2$. The blue set is $\Lambda(\bar U)$ and the green disc is the largest $\delta\bar V$ inside it. Drag $y$: its minimal-norm preimage $x$ is drawn in the domain ball on the right, and $\norm{x}\le\norm{y}/\delta$. Line the three columns up and $\Lambda$ is no longer onto — $\delta$ collapses to $0$.`,
      deps: ['rca-5.6', 'rca-5.1', 'rca-5.2'],
      see: ['fa-2.11'],
      tags: ['open mapping', 'Baire category'],
      viz(v) {
        const M = v.M;
        const sel = v.select('norm on $\\R^3$', [{ value: '1', label: '$\\ell^1$' }, { value: '2', label: '$\\ell^2$' }, { value: 'inf', label: '$\\ell^\\infty$' }], '1');
        const L = v.stage({ x: [-1.9, 1.9], y: [-1.65, 1.65], equal: true, height: 360, weight: 1.25, title: 'target $Y=\\R^2$: $\\Lambda(\\bar U)\\supset\\delta\\bar V$' });
        const D = v.stage3d({ range: 1.95, height: 360, yaw: -0.75, pitch: 0.38, labels: ['x₁', 'x₂', 'x₃'], title: 'domain $X=\\R^3$: unit ball $\\bar U$ and the preimage $x$' });
        const cols = [[1.1, 0.25], [-0.35, 0.95], [0.55, -0.7]].map((c, i) => L.handle(c[0], c[1], { color: ['blue', 'purple', 'teal'][i], r: 6.5 }));
        const yh = L.handle(0.35, 0.3, { color: 'gold', label: 'y' });
        let st = null;
        v.render(() => {
          const p = sel.value === 'inf' ? Infinity : +sel.value;
          const a = cols.map((h) => [h.x, h.y]);
          const A = [[a[0][0], a[1][0], a[2][0]], [a[0][1], a[1][1], a[2][1]]];
          const AAt = M.matMul(A, M.transpose(A));
          const y = [yh.x, yh.y], ny = Math.hypot(y[0], y[1]);
          let boundary = [], delta = 0, x = null;
          if (p === 2) {
            const { values, vectors } = M.eigSym2(AAt);
            const s1 = Math.sqrt(Math.max(0, values[0])), s2 = Math.sqrt(Math.max(0, values[1]));
            delta = s2;
            boundary = M.range(240).map((k) => { const t = M.TAU * k / 240; return M.vadd(M.vscale(vectors[0], s1 * Math.cos(t)), M.vscale(vectors[1], s2 * Math.sin(t))); });
            const inv = M.inverse(AAt);
            if (inv && delta > 1e-6) x = M.matVec(M.transpose(A), M.matVec(inv, y));
          } else {
            const V = imageVertices(a, p);
            const hull = M.hull(V.map((q) => q.y));
            const pre = hull.map((h) => V.find((q) => Math.abs(q.y[0] - h[0]) < 1e-12 && Math.abs(q.y[1] - h[1]) < 1e-12).x);
            boundary = hull;
            if (hull.length >= 3) {
              delta = Infinity;
              for (let i = 0; i < hull.length; i++) {
                const P = hull[i], Q = hull[(i + 1) % hull.length];
                const e = M.vsub(Q, P), L2 = Math.hypot(e[0], e[1]);
                delta = Math.min(delta, Math.abs(P[0] * e[1] - P[1] * e[0]) / (L2 || 1));
              }
              // ray from 0 through y hits an edge: interpolate the vertex preimages there
              if (ny > 1e-9 && delta > 1e-6) {
                for (let i = 0; i < hull.length; i++) {
                  const P = hull[i], Q = hull[(i + 1) % hull.length];
                  const det = y[0] * (P[1] - Q[1]) - y[1] * (P[0] - Q[0]);
                  if (Math.abs(det) < 1e-12) continue;
                  const t = (P[0] * (P[1] - Q[1]) - P[1] * (P[0] - Q[0])) / det;
                  const s = (y[0] * P[1] - y[1] * P[0]) / det;
                  if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9) { x = M.vscale(M.vlerp(pre[i], pre[(i + 1) % hull.length], s), 1 / t); break; }
                }
              } else if (ny <= 1e-9) x = [0, 0, 0];
            }
          }
          const onto = delta > 1e-3;
          // target panel
          L.poly(boundary, { fill: 'blue', fillAlpha: 0.14, color: 'blue', width: 1.8 });
          if (onto) L.circle(0, 0, delta, { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.8 });
          if (onto) L.measure(0, 0, delta * Math.cos(-2.2), delta * Math.sin(-2.2), 'δ', { color: 'green', offset: 10 });
          a.forEach((c, i) => {
            L.arrow(0, 0, c[0], c[1], { color: ['blue', 'purple', 'teal'][i], width: 1.8 });
            L.tex(`\\Lambda e_${i + 1}`, c[0], c[1], { color: ['blue', 'purple', 'teal'][i], align: c[0] >= 0 ? 'left' : 'right', baseline: 'bottom', dx: c[0] >= 0 ? 8 : -8, dy: -4, size: 14 });
          });
          const nx = x ? M.norm(x, p) : Infinity;
          L.arrow(0, 0, y[0], y[1], { color: 'gold', width: 2 });
          L.corner(onto ? `δ = ${v.fmt(delta, 3)} > 0: Λ is onto` : 'columns collinear: Λ not onto, δ = 0', 'tl', { color: onto ? 'green' : 'red', weight: 600 });
          // domain panel
          const ballCol = 'accent';
          if (p === 1) {
            const E = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
            for (const sx of [0, 1]) for (const sy of [2, 3]) for (const sz of [4, 5]) D.poly([E[sx], E[sy], E[sz]], { fill: ballCol, fillAlpha: 0.1, color: ballCol, alpha: 0.5, width: 1 });
          } else if (p === Infinity) {
            const F = [[[1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, -1]], [[-1, 1, 1], [-1, -1, 1], [-1, -1, -1], [-1, 1, -1]], [[1, 1, 1], [-1, 1, 1], [-1, 1, -1], [1, 1, -1]], [[1, -1, 1], [-1, -1, 1], [-1, -1, -1], [1, -1, -1]], [[1, 1, 1], [-1, 1, 1], [-1, -1, 1], [1, -1, 1]], [[1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]]];
            for (const f of F) D.poly(f, { fill: ballCol, fillAlpha: 0.07, color: ballCol, alpha: 0.5, width: 1 });
          } else {
            for (let k = 0; k < 6; k++) { const th = Math.PI * k / 6; D.curve((t) => [Math.cos(t) * Math.cos(th), Math.cos(t) * Math.sin(th), Math.sin(t)], 0, M.TAU, { color: ballCol, alpha: 0.35, width: 1, n: 60 }); }
            for (const z of [-0.5, 0, 0.5]) { const r = Math.sqrt(1 - z * z); D.curve((t) => [r * Math.cos(t), r * Math.sin(t), z], 0, M.TAU, { color: ballCol, alpha: 0.35, width: 1, n: 60 }); }
          }
          if (x) {
            const inside = nx <= 1 + 1e-9;
            const sc = Math.min(1, 1.6 / Math.max(1e-9, M.norm(x, Infinity)));
            const xd = M.vscale(x, sc);
            D.line([xd[0], xd[1], 0], xd, { color: 'faint', width: 1, dash: true });
            D.arrow([0, 0, 0], xd, { color: inside ? 'gold' : 'red', width: 2.4 });
            D.dot(xd, { color: inside ? 'gold' : 'red', r: 5.5, label: 'x' });
          }
          st = { delta, ny, nx, onto, p };
        });
        v.legend([['blue', '$\\Lambda(\\bar U)$', { area: true }], ['green', '$\\delta\\bar V$, largest inscribed ball', { area: true }], ['gold', '$y$ and a preimage $x$ of least norm']]);
        v.readout(() => {
          if (!st) return '';
          if (!st.onto) return 'The range is a line, so $\\Lambda$ is not onto and no ball $\\delta V$ fits inside $\\Lambda(U)$.';
          const pn = st.p === Infinity ? '\\infty' : st.p;
          return `$\\delta = ${v.fix(st.delta, 3)}$, $\\;\\|y\\| = ${v.fix(st.ny, 3)}$, $\\;\\min\\{\\|x\\|_{${pn}}:\\Lambda x=y\\} = ${v.fix(st.nx, 3)} \\le \\|y\\|/\\delta = ${v.fix(st.ny / st.delta, 3)}$` + (st.nx <= 1 ? ' — $y\\in\\Lambda(\\bar U)$.' : ' — $y$ lies outside $\\Lambda(\\bar U)$.');
        });
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Theorem',
      name: 'Bounded inverse theorem',
      credit: 'Banach, 1929',
      statement: String.raw`If $X$ and $Y$ are Banach spaces and $\Lambda:X\to Y$ is a bounded linear transformation that is one-to-one and onto, then there is $\delta>0$ with
$$\norm{\Lambda x}\ge\delta\norm{x}\qquad(x\in X).$$
Equivalently, $\Lambda^{-1}:Y\to X$ is a bounded linear transformation.`,
      idea: String.raw`By the open mapping theorem (5.9), $\Lambda(U)\supset\delta V$. If $\norm{\Lambda x}<\delta$ then $\Lambda x=\Lambda u$ for some $u\in U$, and injectivity forces $x=u$, so $\norm{x}<1$. Scaling gives $\norm{\Lambda x}\ge\delta\norm{x}$.`,
      caption: String.raw`$\Lambda f(x)=f(x)+\int_0^x f$ is a bounded bijection of $X=(C[0,1],\norm{\cdot}_\infty)$ onto $C[0,1]$. With the sup norm on the target (a Banach space) the ratios $\norm{\Lambda f}/\norm{f}$ for the tents $f_k$ never drop below $\delta=1/\|\Lambda^{-1}\|=1/(2-e^{-1})$. Measure the target in the $L^1$ norm instead and the ratios tend to $0$: that target is not complete — the ramps $g_k$ on the right form an $L^1$-Cauchy sequence whose limit is a discontinuous step.`,
      deps: ['rca-5.9'],
      see: ['fa-2.12'],
      tags: ['open mapping', 'inverse'],
      viz(v) {
        const M = v.M;
        const mode = v.select('norm on the target $Y$', [{ value: 'sup', label: '$\\|\\cdot\\|_\\infty$ (complete)' }, { value: 'l1', label: '$\\|\\cdot\\|_1$ (not complete)' }], 'l1');
        const nS = v.slider('$k$', 1, 40, 14, { int: true });
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.22, 1.65], height: 220, full: true, axes: 'box', title: 'the tent $f_k$ (width $2/k$) and its image $\\Lambda f_k = f_k+\\int_0^x f_k$' });
        const R = v.stage({ x: [0, 41], y: [-0.25, 1.55], height: 210, axes: 'box', title: 'ratios $\\|\\Lambda f_j\\|_Y/\\|f_j\\|_\\infty$, $j\\le k$' });
        const C = v.stage({ x: [-0.02, 1.02], y: [-0.25, 1.15], height: 210, axes: 'box', title: 'ramps $g_j$ and their limit' });
        const DELTA = 1 / (2 - Math.exp(-1));
        const NG = 2000;
        const tent = (k) => (x) => Math.max(0, 1 - k * Math.abs(x - 0.5));
        const image = (f) => { const xs = M.linspace(0, 1, NG + 1), ys = []; let I = 0; for (let i = 0; i <= NG; i++) { if (i) I += (f(xs[i - 1]) + f(xs[i])) / 2 / NG; ys.push(f(xs[i]) + I); } return { xs, ys }; };
        const ratio = (k, m) => { const { ys } = image(tent(k)); return m === 'sup' ? Math.max(...ys) : M.integrate((x) => ys[Math.round(x * NG)], 0, 1, NG); };
        const ramp = (j) => (x) => M.clamp(0.5 + j * (x - 0.5), 0, 1);
        let st = null;
        v.render(() => {
          const k = nS.value, m = mode.value;
          const f = tent(k), img = image(f);
          top.fn(f, { domain: [0, 1], color: 'gold', width: 2.4, fill: 'gold', fillAlpha: 0.15, n: 1200 });
          top.path(img.xs.map((x, i) => [x, img.ys[i]]), { color: 'blue', width: 2.2 });
          top.tex('f_k', 0.5, 1, { color: 'gold', baseline: 'bottom', dy: -4 });
          top.tex('\\Lambda f_k', 0.85, img.ys[Math.round(0.85 * NG)], { color: 'blue', baseline: 'bottom', dy: -4 });
          const rs = []; for (let j = 1; j <= k; j++) rs.push([j, ratio(j, m)]);
          if (m === 'sup') {
            R.hband(0, DELTA, { color: 'red', alpha: 0.06 });
            R.hline(DELTA, { color: 'green', width: 1.6, dash: [6, 4] });
            R.text('δ = 1/(2 − 1/e)', 40, DELTA, { align: 'right', dy: 10, color: 'green', size: 12 });
          } else R.hline(0, { color: 'red', width: 1.2, dash: [6, 4] });
          R.path(rs, { color: m === 'sup' ? 'green' : 'red', width: 1.6 });
          R.dots(rs, { r: 3, color: m === 'sup' ? 'green' : 'red' });
          // ramps (Cauchy in L^1, not in sup) converging to a step
          for (const j of [1, 2, 4, 8, 16]) C.fn(ramp(j), { domain: [0, 1], color: 'teal', width: 1.2, alpha: 0.35 + 0.04 * j });
          C.line(0, 0, 0.5, 0, { color: 'red', width: 2.4, dash: [6, 4] });
          C.line(0.5, 1, 1, 1, { color: 'red', width: 2.4, dash: [6, 4] });
          C.dot(0.5, 0, { color: 'red', r: 3.5, hollow: true }); C.dot(0.5, 1, { color: 'red', r: 3.5, hollow: true });
          st = { k, m, r: rs[rs.length - 1][1] };
        });
        v.legend([['gold', 'tent $f_k$, $\\|f_k\\|_\\infty=1$'], ['blue', '$\\Lambda f_k$'], ['teal', 'ramps $g_j$'], ['red', 'the would-be limit (not continuous)', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const r = `$\\|\\Lambda f_{${st.k}}\\|_Y/\\|f_{${st.k}}\\|_\\infty = ${v.fix(st.r, 4)}$`;
          return st.m === 'sup'
            ? r + ` $\\ge\\delta = ${v.fix(DELTA, 4)}$: the inverse is bounded. The ramps are not Cauchy here: $\\|g_j-g_{2j}\\|_\\infty = \\tfrac14$.`
            : r + ` $\\to 0$: no $\\delta>0$ works and $\\Lambda^{-1}$ is unbounded. The ramps are $L^1$-Cauchy ($\\|g_j-g_{2j}\\|_1 = \\tfrac{1}{8j}$) with no continuous limit, so $Y$ is not a Banach space.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Theorem',
      name: 'Continuous functions with divergent Fourier series',
      statement: String.raw`For $f\in C(T)$ let $s_n(f;x)=\sum_{k=-n}^{n}\hat f(k)e^{ikx}$ and $D_n(t)=\sum_{k=-n}^{n}e^{ikt}$. At each fixed $x$, the functional $f\mapsto s_n(f;x)$ has norm $\norm{D_n}_1$, and $\norm{D_n}_1\to\infty$. Hence $\{f\in C(T):\sup_n|s_n(f;x)|=\infty\}$ is a dense $G_\delta$ in $C(T)$.`,
      idea: String.raw`The functionals $\Lambda_nf=s_n(f;0)$ on the Banach space $C(T)$ have norms exactly $\norm{D_n}_1$ (test against continuous approximations of $\operatorname{sgn}D_n$ and use dominated convergence), and $\norm{D_n}_1\ge\frac{4}{\pi^2}\sum_{k\le n}\frac1k\to\infty$. Banach–Steinhaus (5.8) gives a dense $G_\delta$ of $f$ with $\sup_n\abs{s_n(f;0)}=\infty$; repeating this at a countable dense set of points and intersecting (Baire again) yields $E$, and for each $f$ the set $Q_f$ is a $G_\delta$ that contains that dense set.`,
      caption: String.raw`Choose $N$. Top: the Dirichlet kernel $D_N$, its positive and negative lobes shaded. Middle: the continuous function $f=\max(-1,\min(1,D_N))$, with $\norm{f}_\infty=1$, which copies the sign of $D_N$; its partial sum $s_N(f;0)=\int fD_N\,dm$ nearly equals $\norm{D_N}_1$. Bottom: the Lebesgue constants $\norm{D_N}_1$, computed by quadrature, against the asymptote $\frac{4}{\pi^2}\log N+1.27$ — unbounded, which is all Banach–Steinhaus needs.`,
      deps: ['rca-5.8', 'rca-5.6', 'rca-1.34', 'rca-4.26'],
      see: ['pma-8.14'],
      refs: ['Rudin, Real and Complex Analysis, 3rd ed., Sections 5.11–5.12 and complete proof, pp. 100–103'],
      tags: ['Fourier series', 'uniform boundedness'],
      viz(v) {
        const M = v.M;
        const NS = v.slider('$N$', 1, 60, 12, { int: true });
        const top = v.stage({ x: [-Math.PI, Math.PI], y: [-6, 26], height: 220, full: true, xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: 'the Dirichlet kernel $D_N(t)=\\sin((N+\\tfrac12)t)/\\sin(t/2)$' });
        const mid = v.stage({ x: [-Math.PI, Math.PI], y: [-1.4, 1.4], height: 110, full: true, xticks: [], title: '$f=\\max(-1,\\min(1,D_N))\\in C(T)$, $\\;\\|f\\|_\\infty = 1$' });
        const bot = v.stage({ x: [-0.15, Math.log(1150)], y: [0.55, 4.45], height: 200, full: true, axes: 'box', xticks: [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].map((n) => [Math.log(n), String(n)]), title: 'Lebesgue constants $\\|D_N\\|_1=\\int|D_N|\\,dm$, $N$ on a log scale' });
        const NB = M.range(60, 1).concat([75, 100, 130, 170, 220, 300, 400, 520, 680, 850, 1000]);
        const Ls = NB.map((n) => [Math.log(n), lebesgue(M, n)]);
        let st = null;
        v.render(() => {
          const N = NS.value, D = (t) => M.dirichlet(N, t);
          top.setView(null, [-0.3 * (2 * N + 1), 1.08 * (2 * N + 1)]);
          top.fn((t) => Math.max(0, D(t)), { color: 'green', width: 0.1, fill: 'green', fillAlpha: 0.25, n: 3000 });
          top.fn((t) => Math.min(0, D(t)), { color: 'red', width: 0.1, fill: 'red', fillAlpha: 0.25, n: 3000 });
          top.fn(D, { color: 'ink', width: 1.6, n: 3000 });
          top.tex(`D_N(0)=2N+1=${2 * N + 1}`, 0, 2 * N + 1, { dx: 12, align: 'left', color: 'muted', size: 13 });
          const f = (t) => M.clamp(D(t), -1, 1);
          mid.fn(f, { color: 'gold', width: 1.8, n: 3000, fill: 'gold', fillAlpha: 0.15 });
          const sN = M.integrate((t) => f(t) * D(t), 0, Math.PI, 400 + 80 * N) / Math.PI;
          // Lebesgue constants
          const LN = lebesgue(M, N);
          bot.fn((u) => 4 / (Math.PI * Math.PI) * u + 1.27, { domain: [0, Math.log(1150)], color: 'accent', width: 1.6, dash: [6, 4] });
          bot.dots(Ls, { r: 2.6, color: 'muted' });
          bot.dot(Math.log(N), LN, { color: 'red', r: 5.5 });
          bot.dot(Math.log(N), sN, { color: 'gold', r: 4, hollow: true });
          bot.text('(4/π²) log N + 1.27', Math.log(700), 4 / (Math.PI * Math.PI) * Math.log(700) + 1.27, { align: 'right', dy: -14, color: 'accent', size: 12 });
          st = { N, L: LN, sN };
        });
        v.legend([['green', '$D_N>0$', { area: true }], ['red', '$D_N<0$', { area: true }], ['gold', '$f$, sign-copy of $D_N$'], ['red', '$\\|D_N\\|_1$', { dot: true }], ['gold', '$s_N(f;0)$', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          return `$N = ${st.N}$: $\\;\\|D_N\\|_1 = ${v.fix(st.L, 4)}$, $\\;s_N(f;0) = ${v.fix(st.sN, 4)}$ with $\\|f\\|_\\infty = 1$. So $\\|\\Lambda_N\\| = \\|D_N\\|_1\\to\\infty$, and by Banach–Steinhaus $\\sup_N|s_N(f;0)|=\\infty$ for a dense $G_\\delta$ of $f\\in C(T)$.`;
        });
      },
    },
  ],
};
