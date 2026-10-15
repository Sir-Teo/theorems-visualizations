// Rudin, Real and Complex Analysis — Chapter 3: L^p-Spaces
// Part 1 of 3: convex functions, Jensen, conjugate exponents, Hölder and Minkowski (3.1–3.5).
// Parts: ch03-a2.js (3.6–3.11), ch03-a3.js (3.12–3.17).

/** Snap a handle onto the graph of phi, restricted to [lo, hi]. */
function onGraph(phi, lo, hi) {
  return (x) => { const xx = Math.min(hi(), Math.max(lo(), x)); return [xx, phi()(xx)]; };
}

/** Nonnegative cubic Hermite interpolant through (xs[i], ys[i]); constant beyond the end nodes. */
function spline(xs, ys) {
  const n = xs.length;
  const m = ys.map((_, i) => (i === 0 ? (ys[1] - ys[0]) / (xs[1] - xs[0]) : i === n - 1 ? (ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]) : (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1])));
  return (x) => {
    if (x <= xs[0]) return Math.max(0, ys[0]);
    if (x >= xs[n - 1]) return Math.max(0, ys[n - 1]);
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return Math.max(0, (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]);
  };
}

/** L^p norm on [0,1] (Lebesgue measure) of sampled values (midpoint rule); p may be Infinity. */
function lpNorm(vals, p) {
  if (p === Infinity) { let m = 0; for (const x of vals) m = Math.max(m, Math.abs(x)); return m; }
  let s = 0; for (const x of vals) s += Math.abs(x) ** p; return (s / vals.length) ** (1 / p);
}

export default {
  collection: 'rca',
  chapter: 3,
  title: 'L^p-Spaces',
  summary: String.raw`Convexity is the engine of the chapter: it gives Jensen's inequality, and through the convexity of $e^x$ the inequalities of Hölder and Minkowski. These make $L^p(\mu)$ ($1\le p\le\infty$) a normed space once functions that agree almost everywhere are identified, and the Riesz–Fischer argument shows it is complete; a Cauchy sequence even has an a.e.-convergent subsequence. The chapter closes with density results: simple functions, and on locally compact spaces continuous functions with compact support, are dense in $L^p$ for $p<\infty$, while in the sup norm the completion of $C_c(X)$ is $C_0(X)$.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Convex function',
      statement: String.raw`Let $-\infty\le a<b\le\infty$. A real function $\varphi$ on the open segment $(a,b)$ is **convex** if
$$\varphi\big((1-\lambda)x+\lambda y\big)\;\le\;(1-\lambda)\,\varphi(x)+\lambda\,\varphi(y)$$
whenever $x,y\in(a,b)$ and $0\le\lambda\le1$. Equivalently, whenever $a<s<t<u<b$ the slopes increase:
$$\frac{\varphi(t)-\varphi(s)}{t-s}\;\le\;\frac{\varphi(u)-\varphi(t)}{u-t}.$$
A differentiable $\varphi$ is convex exactly when $\varphi'$ is nondecreasing; for instance $e^x$ is convex on $\R$.`,
      idea: String.raw`Geometrically, every chord of the graph lies on or above the graph between its endpoints, i.e. the region above the graph (the epigraph) is a convex set. Writing $t=(1-\lambda)s+\lambda u$ and rearranging the defining inequality gives the slope form, which is what the proofs of 3.2 and Jensen's inequality 3.3 actually use.`,
      caption: String.raw`Drag the endpoints $x$ and $y$ along the graph and slide $\lambda$. The gold point on the chord sits at height $(1-\lambda)\varphi(x)+\lambda\varphi(y)$, the blue point on the graph at $\varphi((1-\lambda)x+\lambda y)$. For a convex $\varphi$ the chord never dips below the graph (green); pick the cubic to see a chord cross the graph (red) where the function is concave.`,
      deps: [],
      tags: ['convexity'],
      viz(v) {
        const M = v.M;
        const FN = {
          exp: { label: '$e^x$', f: (x) => Math.exp(x), lo: -2.4, hi: 2.05, x: [-2.6, 2.3], y: [-0.7, 8.2], x0: -2, y0: 1.9, convex: true },
          kink: { label: '$|x|+\\tfrac14x^2$', f: (x) => Math.abs(x) + 0.25 * x * x, lo: -2.4, hi: 2.4, x: [-2.6, 2.6], y: [-0.5, 4.3], x0: -2.1, y0: 1.2, convex: true },
          inv: { label: '$1/x$ on $(0,\\infty)$', f: (x) => 1 / x, lo: 0.17, hi: 3.8, x: [-0.25, 4], y: [-0.5, 6.2], x0: 0.25, y0: 3, convex: true },
          cubic: { label: '$x^3-2x$ (not convex)', f: (x) => x * x * x - 2 * x, lo: -1.95, hi: 1.95, x: [-2.2, 2.2], y: [-4.2, 4.2], x0: -1.6, y0: 1.3, convex: false },
        };
        let cur = 'exp';
        const which = v.select('$\\varphi$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const lam = v.slider('$\\lambda$', 0, 1, 0.4, { step: 0.01 });
        const S = v.stage({ x: FN.exp.x, y: FN.exp.y, height: 380, full: true });
        const F = () => FN[which.value];
        const phi = () => F().f;
        const hx = S.handle(FN.exp.x0, FN.exp.f(FN.exp.x0), { color: 'accent', label: 'x', constrain: onGraph(phi, () => F().lo, () => F().hi) });
        const hy = S.handle(FN.exp.y0, FN.exp.f(FN.exp.y0), { color: 'accent', label: 'y', constrain: onGraph(phi, () => F().lo, () => F().hi) });
        let st = {};
        v.render(() => {
          const G = F();
          if (cur !== which.value) {
            cur = which.value; S.setView(G.x, G.y);
            hx.x = G.x0; hx.y = G.f(G.x0); hy.x = G.y0; hy.y = G.f(G.y0);
          }
          const f = G.f, l = lam.value;
          const [x, y] = [hx.x, hy.x];
          const chord = (s) => f(x) + (f(y) - f(x)) * (s - x) / (y - x || 1e-9);
          const lo = Math.min(x, y), hi = Math.max(x, y);
          // epigraph (faint) and the graph
          const ea = G === FN.inv ? 0.155 : S.bounds.x[0], eb = S.bounds.x[1];
          S.between(() => S.bounds.y[1] + 1, (s) => Math.min(f(s), S.bounds.y[1] + 1), ea, eb, { fill: 'accent', fillAlpha: 0.05 });
          if (G.lo > 0 && G.lo < 1) S.vline(0, { color: 'faint', dash: [3, 4] });
          S.fn(f, { color: 'ink', width: 2.4, domain: G === FN.inv ? [0.15, G.x[1]] : undefined });
          // where the chord is above (green) or below (red) the graph
          if (hi - lo > 1e-6) {
            S.between((s) => Math.max(chord(s), f(s)), f, lo, hi, { fill: 'green', fillAlpha: 0.22 });
            S.between((s) => Math.min(chord(s), f(s)), f, lo, hi, { fill: 'red', fillAlpha: 0.3 });
          }
          S.line(x, f(x), y, f(y), { color: 'accent', width: 2.2 });
          // the λ-point
          const t = (1 - l) * x + l * y, c = (1 - l) * f(x) + l * f(y), ft = f(t);
          const ok = ft <= c + 1e-12;
          S.line(t, ft, t, c, { color: ok ? 'green' : 'red', width: 2.4 });
          S.vline(t, { color: 'muted', width: 1, dash: [2, 4], alpha: 0.6 });
          S.dot(t, c, { color: 'gold', r: 5.5 });
          S.dot(t, ft, { color: 'blue', r: 5.5 });
          // labels: chord value away from the chord, graph value below the graph, kept inside the panel
          const up = (f(y) - f(x)) / (y - x || 1e-9) > 0, X = S.X(t);
          let gLeft = up; if (gLeft && X < 210) gLeft = false; if (!gLeft && X > S.width - 210) gLeft = true;
          let bLeft = !up; if (bLeft && X < 170) bLeft = false; if (!bLeft && X > S.width - 170) bLeft = true;
          S.tex('(1-\\lambda)\\varphi(x)+\\lambda\\varphi(y)', t, c, { color: 'gold', align: gLeft ? 'right' : 'left', dx: gLeft ? -10 : 10, dy: -13, size: 14 });
          S.tex('\\varphi((1-\\lambda)x+\\lambda y)', t, ft, { color: 'blue', align: bLeft ? 'right' : 'left', dx: bLeft ? -10 : 10, dy: 15, size: 14 });
          // is there any bad chord at all on [lo, hi]?
          let worst = 0; for (let i = 1; i < 120; i++) { const s = lo + (hi - lo) * i / 120; worst = Math.min(worst, chord(s) - f(s)); }
          S.corner(worst < -1e-9 ? 'this chord dips below the graph — φ is not convex' : 'chord ≥ graph on [x, y]', 'tl', { color: worst < -1e-9 ? 'red' : 'green', weight: 600 });
          st = { t, c, ft, ok };
          v.legend([['ink', 'graph of $\\varphi$'], ['accent', 'chord from $x$ to $y$'], ['green', 'chord above graph', { area: true }], ['red', 'chord below graph', { area: true }], ['accent', 'epigraph', { area: true }]]);
        });
        v.readout(() => `$t=(1-\\lambda)x+\\lambda y = ${v.fix(st.t, 3)}$: $\\;\\varphi(t) = ${v.fix(st.ft, 3)}$ ${st.ok ? '$\\le$' : '$>$'} $${v.fix(st.c, 3)} = (1-\\lambda)\\varphi(x)+\\lambda\\varphi(y)$` + (st.ok ? '' : ' — the convexity inequality fails here.'));
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Convex functions on open intervals are continuous',
      statement: String.raw`If $\varphi$ is convex on the open segment $(a,b)$, then $\varphi$ is continuous on $(a,b)$.`,
      idea: String.raw`Fix $a<s<t<u<b$ and put $m_1$, $m_2$ for the slopes of the chords over $[s,t]$ and $[t,u]$. The slope inequality of 3.1 traps the graph over $[s,u]$ inside the "bow-tie" formed by the two lines of slopes $m_1,m_2$ through $(t,\varphi(t))$; hence $|\varphi(x)-\varphi(t)|\le\max(|m_1|,|m_2|)\,|x-t|$ near $t$, and $\varphi$ is even locally Lipschitz. The argument needs points on *both* sides of $t$, which is why the segment must be open: at an endpoint a convex function may jump.`,
      caption: String.raw`Drag $s<t<u$ along the graph. The orange bow-tie is bounded by the lines through $(t,\varphi(t))$ with the chord slopes $m_1$ and $m_2$; the graph cannot leave it, so it is pinched to $\varphi(t)$ as $x\to t$. Move the gold probe $x$ to compare $|\varphi(x)-\varphi(t)|$ with the bound. Choose the closed interval to see the hypothesis fail: at the endpoint $a$ there is no $s<t$, the cone is one-sided, and $\varphi$ jumps.`,
      deps: ['rca-3.1'],
      tags: ['convexity', 'continuity'],
      viz(v) {
        const M = v.M;
        const FN = {
          smooth: { label: '$e^{x}-2x$ on $(-2,2)$', f: (x) => Math.exp(x) - 2 * x, a: -2, b: 2, x: [-2.3, 2.3], y: [-0.4, 4.6], closed: false, s: -1.3, t: -0.1, u: 1.2 },
          kink: { label: '$\\max(-x,\\,\\tfrac{x}{2})+\\tfrac{x^2}{4}$ on $(-2,2)$', f: (x) => Math.max(-x, 0.5 * x) + 0.25 * x * x, a: -2, b: 2, x: [-2.3, 2.3], y: [-0.4, 3.3], closed: false, s: -1.1, t: 0, u: 1.3 },
          closed: { label: 'closed $[0,2]$, jump at $0$', f: (x) => (x <= 0 ? 2.2 : (x - 1) * (x - 1) + 0.3), a: 0, b: 2, x: [-0.3, 2.3], y: [-0.3, 2.8], closed: true, s: 0, t: 0, u: 1.2 },
        };
        let cur = 'smooth';
        const which = v.select('', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'smooth');
        const S = v.stage({ x: FN.smooth.x, y: FN.smooth.y, height: 380, full: true });
        const F = () => FN[which.value];
        const gap = 0.12;
        const hs = S.handle(0, 0, { color: 'accent', label: 's', constrain: (x) => { const G = F(); const xx = M.clamp(x, G.a + 0.03, ht.x - gap); return [xx, G.f(xx)]; } });
        const ht = S.handle(0, 0, { color: 'ink', label: 't', constrain: (x) => { const G = F(); const xx = M.clamp(x, hs.x + gap, hu.x - gap); return [xx, G.f(xx)]; } });
        const hu = S.handle(0, 0, { color: 'accent', label: 'u', constrain: (x) => { const G = F(); const xx = M.clamp(x, ht.x + gap, G.b - 0.03); return [xx, G.f(xx)]; } });
        const hp = S.handle(0, 0, { color: 'gold', r: 6, label: 'x', constrain: (x) => { const G = F(); const xx = M.clamp(x, G.closed ? G.a + 0.004 : hs.x, hu.x); return [xx, G.f(xx)]; } });
        const place = () => {
          const G = F();
          hs.x = G.s; ht.x = G.t; hu.x = G.u; hp.x = G.closed ? 0.35 : (G.t + G.u) / 2;
          for (const h of [hs, ht, hu, hp]) h.y = G.f(h.x);
          hs.visible = ht.visible = !G.closed;
        };
        place();
        let st = {};
        v.render(() => {
          const G = F(), f = G.f;
          if (cur !== which.value) { cur = which.value; S.setView(G.x, G.y); place(); }
          const t = ht.x, ft = f(t), u = hu.x, fu = f(u), xp = hp.x, fp = f(xp);
          // interval ends
          S.vband(S.bounds.x[0], G.a, { color: 'faint', alpha: 0.25 });
          S.vband(G.b, S.bounds.x[1], { color: 'faint', alpha: 0.25 });
          if (!G.closed) {
            const s = hs.x, fs = f(s);
            const m1 = (ft - fs) / (t - s), m2 = (fu - ft) / (u - t);
            const L1 = (x) => ft + m1 * (x - t), L2 = (x) => ft + m2 * (x - t);
            S.poly([[s, L1(s)], [t, ft], [s, L2(s)]], { fill: 'orange', fillAlpha: 0.2, stroke: false });
            S.poly([[u, L2(u)], [t, ft], [u, L1(u)]], { fill: 'orange', fillAlpha: 0.2, stroke: false });
            S.fn(L1, { color: 'orange', width: 1, dash: [4, 4], alpha: 0.7 });
            S.fn(L2, { color: 'orange', width: 1, dash: [4, 4], alpha: 0.7 });
            S.line(s, L1(s), u, L1(u), { color: 'orange', width: 2 });
            S.line(s, L2(s), u, L2(u), { color: 'orange', width: 2 });
            // slope labels just outside [s, u], on whichever side has room
            const leftRoom = S.X(s) > 110;
            const xl = leftRoom ? s - 0.1 : u + 0.1, al = leftRoom ? 'right' : 'left';
            const hi1 = L1(xl) > L2(xl);
            S.tex('\\text{slope } m_1', xl, L1(xl), { color: 'orange', align: al, baseline: hi1 ? 'bottom' : 'top', dy: hi1 ? -3 : 3, size: 13 });
            S.tex('\\text{slope } m_2', xl, L2(xl), { color: 'orange', align: al, baseline: hi1 ? 'top' : 'bottom', dy: hi1 ? 3 : -3, size: 13 });
            S.fn(f, { color: 'ink', width: 2.4, domain: [G.a, G.b] });
            S.dot(G.a, f(G.a + 1e-6), { hollow: true, color: 'ink', r: 4 }); S.dot(G.b, f(G.b - 1e-6), { hollow: true, color: 'ink', r: 4 });
            const Lc = Math.max(Math.abs(m1), Math.abs(m2));
            S.line(xp, ft, xp, fp, { color: 'gold', width: 2.6 });
            S.dot(xp, ft, { color: 'gold', r: 3 });
            const inside = Math.abs(fp - ft) <= Lc * Math.abs(xp - t) + 1e-9;
            S.corner(`slopes  m₁ = ${v.fix(m1, 3)}  ≤  m₂ = ${v.fix(m2, 3)}`, 'tl', { color: 'orange', weight: 600 });
            st = { closed: false, m1, m2, Lc, d: Math.abs(fp - ft), bound: Lc * Math.abs(xp - t), inside };
          } else {
            // closed interval with a jump at the endpoint a = 0: only the upper chord exists
            const m2 = (fu - ft) / (u - t);
            const L2 = (x) => ft + m2 * (x - t);
            S.poly([[t, ft], [u, fu], [u, S.bounds.y[0] - 1], [t, S.bounds.y[0] - 1]], { fill: 'red', fillAlpha: 0.07, stroke: false });
            S.line(t, ft, u, fu, { color: 'orange', width: 2 });
            S.fn(L2, { color: 'orange', width: 1, dash: [4, 4], alpha: 0.7 });
            S.fn(f, { color: 'ink', width: 2.4, domain: [1e-6, G.b] });
            S.dot(0, f(1e-9), { hollow: true, color: 'ink', r: 5 });
            S.dot(0, ft, { color: 'ink', r: 6, label: 'φ(a)', labelPos: 'e' });
            S.dot(G.b, f(G.b), { color: 'ink', r: 4 });
            S.line(xp, ft, xp, fp, { color: 'red', width: 2.6 });
            S.dot(xp, ft, { color: 'red', r: 3 });
            S.corner('t = a is an endpoint: no s < t, so the cone has no lower edge', 'tl', { color: 'red', weight: 600 });
            st = { closed: true, jump: ft - f(1e-9), d: Math.abs(fp - ft) };
          }
          v.legend(G.closed
            ? [['ink', 'convex $\\varphi$ on $[a,b]$'], ['orange', 'chord from $a$'], ['red', '$|\\varphi(x)-\\varphi(a)|$']]
            : [['ink', 'graph of $\\varphi$'], ['orange', 'bow-tie from slopes $m_1\\le m_2$', { area: true }], ['gold', '$|\\varphi(x)-\\varphi(t)|$ at the probe']]);
        });
        v.readout(() => st.closed
          ? `$\\varphi(a)=2.2$ but $\\lim_{x\\to a^+}\\varphi(x)=0.3+1=1.3$: a jump of $${v.fix(st.jump, 2)}$ at the endpoint. At the probe $|\\varphi(x)-\\varphi(a)| = ${v.fix(st.d, 3)}\\not\\to 0$.`
          : `$|\\varphi(x)-\\varphi(t)| = ${v.fix(st.d, 4)} \\;\\le\\; \\max(|m_1|,|m_2|)\\,|x-t| = ${v.fix(st.bound, 4)}$ — so $\\varphi(x)\\to\\varphi(t)$ as $x\\to t$.`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Theorem',
      name: "Jensen's inequality",
      credit: 'Jensen, 1906',
      statement: String.raw`Let $\mu$ be a positive measure on a $\sigma$-algebra in a set $\Omega$ with $\mu(\Omega)=1$. Suppose $f\in L^1(\mu)$ is real with $a<f(x)<b$ for every $x\in\Omega$ (where $-\infty\le a<b\le\infty$), and $\varphi$ is convex on $(a,b)$. Then
$$\varphi\Big(\int_\Omega f\,d\mu\Big)\;\le\;\int_\Omega(\varphi\circ f)\,d\mu .$$
Here $\varphi\circ f$ need not be in $L^1(\mu)$; its integral always exists in the extended sense, possibly equal to $+\infty$.`,
      idea: String.raw`Put $t=\int f\,d\mu$; then $a<t<b$. By the slope inequality of 3.1, the supremum $\beta$ of the slopes of chords ending at $t$ from the left is at most every slope starting at $t$, so the line $y=\varphi(t)+\beta(s-t)$ supports the graph: $\varphi(s)\ge\varphi(t)+\beta(s-t)$ on $(a,b)$. Substitute $s=f(x)$ and integrate against the probability measure $\mu$; the linear term integrates to $0$. Continuity (3.2) makes $\varphi\circ f$ measurable.`,
      caption: String.raw`Here $\Omega$ has four points: $f$ takes the values $x_1,\dots,x_4$ (drag the gold atoms along the graph) with probabilities $\mu_i$ (drag the bars below; they always sum to $1$). The green point $\big(\int f,\int\varphi\circ f\big)$ is the centre of mass of the atoms, so it lies in their convex hull and hence above the blue point $\big(\int f,\varphi(\int f)\big)$ on the graph. The orange supporting line is the one used in the proof. Choose the concave $x^{1/2}$ to watch the inequality reverse.`,
      deps: ['rca-3.1', 'rca-3.2', 'rca-1.30'],
      tags: ['convexity', 'inequalities'],
      viz(v) {
        const M = v.M;
        const FN = {
          exp: { label: '$e^x$', f: Math.exp, lo: -2.1, hi: 2.02, x: [-2.4, 2.4], y: [-0.7, 8], atoms: [-1.7, -0.5, 0.6, 1.8], convex: true },
          sq: { label: '$x^2$', f: (x) => x * x, lo: -2.1, hi: 2.1, x: [-2.4, 2.4], y: [-0.5, 4.8], atoms: [-1.6, -0.7, 0.4, 1.7], convex: true },
          abs: { label: '$|x|$', f: Math.abs, lo: -2.1, hi: 2.1, x: [-2.4, 2.4], y: [-0.4, 2.5], atoms: [-1.5, -0.4, 0.5, 1.4], convex: true },
          nlog: { label: '$-\\log x$ on $(0,\\infty)$', f: (x) => -Math.log(x), lo: 0.12, hi: 4, x: [-0.15, 4.25], y: [-1.6, 2.4], atoms: [0.3, 1, 2, 3.5], convex: true },
          sqrt: { label: '$\\sqrt{x}$ (concave)', f: Math.sqrt, lo: 0.02, hi: 4, x: [-0.15, 4.25], y: [-0.3, 2.3], atoms: [0.1, 0.7, 2.2, 3.7], convex: false },
        };
        let cur = 'exp';
        const which = v.select('$\\varphi$', Object.entries(FN).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const T = v.stage({ x: FN.exp.x, y: FN.exp.y, height: 330, full: true });
        const B = v.stage({ x: FN.exp.x, y: [-0.16, 1.02], height: 160, full: true, title: 'the probability measure: $\\mu_i=\\mu(\\{f=x_i\\})$', yticks: [0.25, 0.5, 0.75, 1] });
        const F = () => FN[which.value];
        const atoms = FN.exp.atoms.map((x, i) => T.handle(x, FN.exp.f(x), { color: 'gold', r: 7, label: `x${'₁₂₃₄'[i]}`, constrain: onGraph(() => F().f, () => F().lo, () => F().hi) }));
        let w = [0.2, 0.3, 0.35, 0.15];
        const bars = w.map((wi, i) => {
          const h = B.handle(atoms[i].x, wi, { color: 'gold', r: 6, constrain: (x, y) => [atoms[i].x, M.clamp(y, 0.02, 0.9)] });
          h.onDrag = () => {
            const rest = w.reduce((s, q, j) => (j === i ? s : s + q), 0);
            const k = (1 - h.y) / (rest || 1);
            w = w.map((q, j) => (j === i ? h.y : q * k));
            bars.forEach((b, j) => { b.y = w[j]; });
          };
          return h;
        });
        let st = {};
        v.render(() => {
          const G = F(), f = G.f;
          if (cur !== which.value) {
            cur = which.value; T.setView(G.x, G.y); B.setView(G.x, null);
            atoms.forEach((a, i) => { a.x = G.atoms[i]; a.y = f(a.x); });
          }
          atoms.forEach((a, i) => { bars[i].x = a.x; bars[i].y = w[i]; a.r = 4.5 + 9 * Math.sqrt(w[i]); });
          const xs = atoms.map((a) => a.x), ys = xs.map(f);
          const m = M.sum(xs, (x, i) => w[i] * x), Ephi = M.sum(ys, (y, i) => w[i] * y), fm = f(m);
          // supporting line at m (slope = left derivative, as in the proof)
          const hh = 1e-5, beta = (fm - f(m - hh)) / hh;
          T.fn((s) => fm + beta * (s - m), { color: 'orange', width: 1.6, dash: [6, 5] });
          // convex hull of the atoms on the graph
          const hull = M.hull(xs.map((x, i) => [x, ys[i]]));
          T.poly(hull, { fill: 'gold', fillAlpha: 0.13, color: 'gold', width: 1.2, dash: [3, 3] });
          T.fn(f, { color: 'ink', width: 2.4, domain: [Math.max(G.x[0], G.lo - (G.lo > 0 ? 0.1 : 1)), G.x[1]] });
          T.vline(m, { color: 'muted', width: 1, dash: [2, 4] });
          const good = fm <= Ephi + 1e-12;
          T.line(m, fm, m, Ephi, { color: good ? 'green' : 'red', width: 3 });
          T.dot(m, Ephi, { color: 'green', r: 6.5 });
          T.dot(m, fm, { color: 'blue', r: 6.5 });
          // green label on the side where the graph is low, blue label on the side where it rises
          let gl = beta > 0; if (gl && T.X(m) < 170) gl = false; if (!gl && T.X(m) > T.width - 170) gl = true;
          let bl = !gl; if (bl && T.X(m) < 150) bl = false; if (!bl && T.X(m) > T.width - 150) bl = true;
          T.tex('\\big(\\textstyle\\int f,\\int\\varphi\\circ f\\big)', m, Ephi, { color: 'green', align: gl ? 'right' : 'left', dx: gl ? -11 : 11, dy: good ? -12 : 12, size: 14 });
          T.tex('\\big(\\textstyle\\int f,\\varphi(\\int f)\\big)', m, fm, { color: 'blue', align: bl ? 'right' : 'left', dx: bl ? -11 : 11, dy: good ? 13 : -13, size: 14 });
          if (!G.convex) T.corner('φ is concave, not convex: the centre of mass lies BELOW the graph', 'tl', { color: 'red', weight: 600 });
          // bottom: the measure
          B.vline(m, { color: 'blue', width: 1.5, dash: [4, 3] });
          xs.forEach((x, i) => B.line(x, 0, x, w[i], { color: 'gold', width: 9, cap: 'butt', alpha: 0.75 }));
          B.tex('\\textstyle\\int f\\,d\\mu', m, 0.98, { color: 'blue', align: 'left', baseline: 'top', dx: 6, size: 13 });
          st = { m, Ephi, fm, good, convex: G.convex };
          v.legend([['ink', 'graph of $\\varphi$'], ['gold', 'atoms $(x_i,\\varphi(x_i))$ and their hull', { area: true }], ['orange', 'supporting line at $\\int f$', { dash: true }]]);
        });
        v.readout(() => `$\\int f\\,d\\mu = ${v.fix(st.m, 3)}$: $\\;\\varphi\\big(\\int f\\,d\\mu\\big) = ${v.fix(st.fm, 4)}$ ${st.good ? '$\\le$' : '$>$'} $${v.fix(st.Ephi, 4)} = \\int\\varphi\\circ f\\,d\\mu$` + (st.convex ? ` (gap $${v.fix(st.Ephi - st.fm, 4)}$)` : ' — Jensen needs convexity; for concave $\\varphi$ the inequality runs the other way.'));
      },
    },

    // ------------------------------------------------------------------ 3.3a
    {
      num: '3.3a',
      kind: 'Corollary',
      name: 'Arithmetic–geometric mean inequality',
      statement: String.raw`For positive numbers $y_1,\dots,y_n$,
$$(y_1y_2\cdots y_n)^{1/n}\;\le\;\frac{y_1+y_2+\cdots+y_n}{n},$$
and more generally $y_1^{\alpha_1}\cdots y_n^{\alpha_n}\le\alpha_1y_1+\cdots+\alpha_ny_n$ whenever $\alpha_i>0$ and $\sum\alpha_i=1$. Both follow from $\exp\big(\int f\,d\mu\big)\le\int e^{f}\,d\mu$, the case $\varphi=e^x$ of Jensen's inequality.`,
      idea: String.raw`Take $\Omega=\{1,\dots,n\}$ with $\mu(\{i\})=\alpha_i$ (or $1/n$) and $f(i)=x_i=\log y_i$. Jensen with the convex function $e^x$ gives $e^{\sum\alpha_ix_i}\le\sum\alpha_ie^{x_i}$, which is the claim after substituting $y_i=e^{x_i}$. Equality forces all $y_i$ to coincide, because $e^x$ is strictly convex.`,
      caption: String.raw`Drag the tops of the bars. The blue line is the geometric mean $G$, the green line the arithmetic mean $A$; the shaded gap never closes unless all bars are equal (press *equalize*). On the right the same numbers sit on the graph of $e^x$ at $x_i=\log y_i$: the centre of mass of the points is $(\log G, A)$, directly above $(\log G, G)$ — Jensen for $e^x$.`,
      deps: ['rca-3.3'],
      tags: ['inequalities', 'convexity'],
      verify: true,
      viz(v) {
        const M = v.M;
        const N = v.slider('$n$', 2, 6, 4, { int: true });
        const L = v.stage({ x: [0.3, 6.7], y: [0, 6.6], height: 330, title: 'the numbers $y_1,\\dots,y_n$', xticks: [1, 2, 3, 4, 5, 6].map((i) => [i, `y${'₁₂₃₄₅₆'[i - 1]}`]) });
        const R = v.stage({ x: [-2, 2.05], y: [0, 6.6], height: 330, title: 'on the graph of $e^x$, at $x_i=\\log y_i$' });
        const init = [1.1, 4.6, 2.3, 5.4, 0.6, 3.2];
        const H = init.map((y, i) => L.handle(i + 1, y, { color: 'gold', r: 6.5, constrain: (x, yy) => [i + 1, M.clamp(yy, 0.2, 6.3)] }));
        v.button('equalize', () => { const n = N.value, A = M.mean(H.slice(0, n).map((h) => h.y)); H.slice(0, n).forEach((h) => { h.y = A; }); });
        v.button('spread out', () => { H.forEach((h, i) => { h.y = init[i]; }); });
        let st = {};
        v.render(() => {
          const n = N.value; const ys = H.slice(0, n).map((h) => h.y);
          H.forEach((h, i) => { h.visible = i < n; });
          L.setView([0.3, n + 0.7], null);
          const A = M.mean(ys), G = Math.exp(M.mean(ys.map(Math.log)));
          L.hband(G, A, { color: 'green', alpha: 0.12 });
          ys.forEach((y, i) => L.rect(i + 1 - 0.3, 0, i + 1 + 0.3, y, { fill: 'gold', fillAlpha: 0.45, stroke: false }));
          L.hline(A, { color: 'green', width: 2.2 });
          L.hline(G, { color: 'blue', width: 2.2, dash: [7, 4] });
          L.tex('A', L.bounds.x[1], A, { color: 'green', align: 'right', baseline: 'bottom', dx: -6, dy: -2 });
          L.tex('G', L.bounds.x[1], G, { color: 'blue', align: 'right', baseline: 'top', dx: -6, dy: 2 });
          // right panel: Jensen for e^x
          const xs = ys.map(Math.log);
          R.fn(Math.exp, { color: 'ink', width: 2.2 });
          const pts = xs.map((x, i) => [x, ys[i]]);
          if (n > 2) R.poly(M.hull(pts), { fill: 'gold', fillAlpha: 0.12, color: 'gold', width: 1, dash: [3, 3] }); else R.segment(pts[0], pts[1], { color: 'gold', width: 1.2, dash: [3, 3] });
          pts.forEach(([x, y]) => R.dot(x, y, { color: 'gold', r: 5.5 }));
          const lg = Math.log(G);
          R.hline(A, { color: 'green', width: 1, dash: [3, 4], alpha: 0.8 });
          R.hline(G, { color: 'blue', width: 1, dash: [3, 4], alpha: 0.8 });
          R.line(lg, G, lg, A, { color: A - G > 1e-9 ? 'green' : 'muted', width: 3 });
          R.dot(lg, A, { color: 'green', r: 6.5, label: '(log G, A)', labelPos: 'nw' });
          R.dot(lg, G, { color: 'blue', r: 6.5, label: '(log G, G)', labelPos: R.X(lg) > R.width - 110 ? 'sw' : 'e' });
          st = { A, G, n };
          v.legend([['gold', '$y_i$', { area: true }], ['green', 'arithmetic mean $A$'], ['blue', 'geometric mean $G$', { dash: true }]]);
        });
        v.readout(() => `$G=(y_1\\cdots y_{${st.n}})^{1/${st.n}} = ${v.fix(st.G, 4)} \\;\\le\\; ${v.fix(st.A, 4)} = \\frac{y_1+\\cdots+y_{${st.n}}}{${st.n}} = A$` + (st.A - st.G < 5e-5 ? ' — equality: all $y_i$ are equal.' : `, gap $A-G=${v.fix(st.A - st.G, 4)}$`));
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Conjugate exponents',
      statement: String.raw`Positive real numbers $p$ and $q$ with $p+q=pq$, or equivalently
$$\frac1p+\frac1q=1,$$
are called a pair of **conjugate exponents**; this forces $1<p<\infty$ and $1<q<\infty$, and $p=q=2$ is the self-conjugate case. Since $q\to\infty$ as $p\to1$, the pair $1$ and $\infty$ is also regarded as conjugate.`,
      idea: String.raw`Solving gives $q=p/(p-1)$, so the conjugate pairs fill one branch of the hyperbola $(p-1)(q-1)=1$. Under $(p,q)\mapsto(1/p,1/q)$ that branch becomes the open segment from $(1,0)$ to $(0,1)$ on the line $x+y=1$, and the convention adds its two endpoints $(1,\infty)$ and $(\infty,1)$.`,
      caption: String.raw`Drag $p$ along the hyperbola $(p-1)(q-1)=1$ (left); the right panel shows the same pair as the point $(1/p,1/q)$ on the segment $x+y=1$. The dot at $(2,2)$ is the Hilbert-space case $p=q=2$; pushing $p$ toward $1$ sends $q$ off to $\infty$, which is the convention behind the pair $(1,\infty)$.`,
      deps: [],
      tags: ['Lp spaces'],
      verify: true,
      viz(v) {
        const M = v.M;
        const L = v.stage({ x: [0, 7.2], y: [0, 7.2], equal: true, height: 340, xlabel: 'p', ylabel: 'q', weight: 1.25, title: 'pairs $(p,q)$ on $(p-1)(q-1)=1$' });
        const R = v.stage({ x: [-0.17, 1.12], y: [-0.15, 1.12], equal: true, height: 340, title: 'reciprocals: $(1/p,\\,1/q)$ on $x+y=1$' });
        const conj = (p) => p / (p - 1);
        const hp = L.handle(3, 1.5, { color: 'accent', label: '(p, q)', constrain: (x, y) => {
          // project to the curve: use the parameter closest to the pointer
          let best = 3, bd = Infinity;
          for (let k = 0; k <= 400; k++) { const p = 1.17 + (7 - 1.17) * k / 400, d = Math.hypot(p - x, conj(p) - y); if (d < bd) { bd = d; best = p; } }
          return [best, conj(best)];
        } });
        let st = {};
        v.render(() => {
          const p = hp.x, q = conj(p);
          L.vline(1, { color: 'faint', dash: [5, 4] }); L.hline(1, { color: 'faint', dash: [5, 4] });
          L.fn(conj, { domain: [1.155, L.bounds.x[1]], color: 'ink', width: 2.2 });
          L.dot(2, 2, { color: 'green', r: 5, label: 'p = q = 2', labelPos: 'ne' });
          L.line(p, 0, p, q, { color: 'accent', width: 1, dash: [3, 4] });
          L.line(0, q, p, q, { color: 'orange', width: 1, dash: [3, 4] });
          L.arrow(1.25, 6.2, 1.25, 7.1, { color: 'muted', width: 1.4, head: 8 });
          L.text('p → 1 ⇒ q → ∞', 1.45, 6.75, { color: 'muted', size: 12 });
          // right: the segment
          R.rect(0, 0, 1, 1, { color: 'faint', width: 1 });
          R.line(1, 0, 0, 1, { color: 'ink', width: 2.2 });
          R.dot(1, 0, { color: 'purple', r: 5.5, label: '(p,q) = (1,∞)', labelPos: 'ne' });
          R.dot(0, 1, { color: 'purple', r: 5.5, label: '(p,q) = (∞,1)', labelPos: 'ne' });
          R.dot(0.5, 0.5, { color: 'green', r: 4.5 });
          const a = 1 / p, b = 1 / q;
          R.line(a, 0, a, b, { color: 'accent', width: 2, dash: [3, 3] });
          R.line(0, b, a, b, { color: 'orange', width: 2, dash: [3, 3] });
          R.measure(0, -0.05, a, -0.05, '1/p', { color: 'accent', offset: 13 });
          R.measure(-0.05, 0, -0.05, b, '1/q', { color: 'orange', offset: -18 });
          R.dot(a, b, { color: 'accent', r: 7 });
          st = { p, q };
          v.legend([['ink', 'conjugate pairs'], ['purple', 'endpoint pairs by convention', { dot: true }], ['green', '$p=q=2$', { dot: true }]]);
        });
        v.readout(() => `$p = ${v.fix(st.p, 3)}$, $\\;q = \\frac{p}{p-1} = ${v.fix(st.q, 3)}$: $\\;\\frac1p+\\frac1q = ${v.fix(1 / st.p, 4)} + ${v.fix(1 / st.q, 4)} = ${v.fix(1 / st.p + 1 / st.q, 4)}$ and $p+q = ${v.fix(st.p + st.q, 3)} = pq$.`);
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Hölder and Minkowski inequalities',
      credit: 'Hölder & Minkowski, 1889',
      statement: String.raw`Let $p$ and $q$ be conjugate exponents with $1<p<\infty$, let $\mu$ be a measure on $X$, and let $f,g$ be measurable functions on $X$ with values in $[0,\infty]$. Then
(a) (Hölder) $\displaystyle\int_X fg\,d\mu\le\Big(\int_X f^p\,d\mu\Big)^{1/p}\Big(\int_X g^q\,d\mu\Big)^{1/q}$;
(b) (Minkowski) $\displaystyle\Big(\int_X (f+g)^p\,d\mu\Big)^{1/p}\le\Big(\int_X f^p\,d\mu\Big)^{1/p}+\Big(\int_X g^p\,d\mu\Big)^{1/p}$.
For $p=q=2$, (a) is the Schwarz inequality.`,
      idea: String.raw`(a) Write $A,B$ for the two factors on the right; the cases $A$ or $B\in\{0,\infty\}$ are trivial. With $F=f/A$, $G=g/B$ we have $\int F^p=\int G^q=1$, and convexity of $e^x$ (3.1) gives, pointwise, $FG=e^{s/p+t/q}\le e^s/p+e^t/q=F^p/p+G^q/q$ (where $F=e^{s/p}$, $G=e^{t/q}$ at points with $F,G>0$; elsewhere the inequality is trivial). Integrating gives $\int FG\le 1/p+1/q=1$. (b) Split $(f+g)^p=f(f+g)^{p-1}+g(f+g)^{p-1}$, apply (a) to each term using $(p-1)q=p$, and divide by $\big(\int(f+g)^p\big)^{1/q}$ (after checking it is finite, by convexity of $t^p$).`,
      caption: String.raw`Drag the blue nodes of $f$ and the orange nodes of $g$ (both on $[0,1]$ with Lebesgue measure) and vary $p$. **Hölder:** the right panel normalizes $F=f/\|f\|_p$, $G=g/\|g\|_q$ and shows the product $FG$ (gold) under the pointwise bound $F^p/p+G^q/q$ (green), whose integral is exactly $1$ — that is the whole proof. Switch on the equality case $g=f^{p-1}$ and the ratio below hits $1$. **Minkowski:** the right panel splits $(f+g)^p$ as in the proof; the chart compares $\|f+g\|_p$ with $\|f\|_p+\|g\|_p$, including $p<1$, where the inequality reverses.`,
      deps: ['rca-3.4', 'rca-3.1'],
      see: ['pma-1.35'],
      tags: ['inequalities', 'Lp spaces'],
      verify: true,
      viz(v) {
        const M = v.M;
        const mode = v.select('', [{ value: 'h', label: '(a) Hölder' }, { value: 'm', label: '(b) Minkowski' }], 'h');
        const P = v.slider('$p$', 1.05, 6, 2.6, { step: 0.01 });
        const eq = v.toggle('equality case $g=f^{\\,p-1}$', false);
        const A = v.stage({ x: [-0.03, 1.03], y: [-0.28, 2.15], height: 290, title: 'the functions $f$ and $g$ on $[0,1]$' });
        const Bs = v.stage({ x: [-0.03, 1.03], y: [-0.1, 3], height: 290, title: 'normalized: $FG$ under $F^p/p+G^q/q$' });
        const C = v.stage({ x: [1, 6.2], y: [0, 1.15], height: 170, full: true, axes: 'box', xlabel: 'p' });
        const fx = [0, 0.25, 0.5, 0.75, 1], gx = [0.125, 0.375, 0.625, 0.875];
        const Hf = [0.25, 1.7, 0.85, 0.35, 0.15].map((y, i) => A.handle(fx[i], y, { color: 'accent', r: 6, constrain: (x, yy) => [fx[i], M.clamp(yy, 0, 2.05)] }));
        const Hg = [0.15, 0.45, 1.5, 0.9].map((y, i) => A.handle(gx[i], y, { color: 'orange', r: 6, constrain: (x, yy) => [gx[i], M.clamp(yy, 0, 2.05)] }));
        const NS = 500, X = M.range(NS).map((i) => (i + 0.5) / NS);
        const norm = (vals, p) => lpNorm(vals, p);
        let st = {};
        v.render(() => {
          const p = P.value, q = p / (p - 1);
          const f = spline(fx, Hf.map((h) => h.y));
          const fv = X.map(f);
          const fm = Math.max(...fv) || 1;
          const g = eq.value ? (x) => (f(x) / fm) ** (p - 1) * 1.6 : spline(gx, Hg.map((h) => h.y));
          const gv = X.map(g);
          Hg.forEach((h) => { h.visible = !eq.value; });
          // panel A
          A.fn(f, { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.08, domain: [0, 1] });
          A.fn(g, { color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.08, domain: [0, 1] });
          if (mode.value === 'm') A.fn((x) => f(x) + g(x), { color: 'green', width: 2, dash: [6, 4], domain: [0, 1] });
          const fpk = M.argmax(fv), gpk = M.argmax(gv);
          A.tex('f', X[fpk], fv[fpk], { color: 'accent', align: 'right', dx: -6, dy: -14, size: 17 });
          A.tex('g', X[gpk], gv[gpk], { color: 'orange', align: 'left', dx: 6, dy: -14, size: 17 });
          if (mode.value === 'h') {
            const nf = norm(fv, p), ng = norm(gv, q);
            const F = fv.map((y) => y / nf), G = gv.map((y) => y / ng);
            const Y = F.map((a, i) => a ** p / p + G[i] ** q / q), FG = F.map((a, i) => a * G[i]);
            const top = Math.max(1.2, ...Y) * 1.22;
            Bs.setView(null, [-top * 0.13, top]);
            Bs.setTitle('normalized: $FG$ under $F^p/p+G^q/q$');
            const pts = (arr) => X.map((x, i) => [x, arr[i]]);
            Bs.path(pts(Y).concat([[1, 0], [0, 0]]), { fill: 'green', fillAlpha: 0.12, stroke: false, close: true });
            Bs.path(pts(FG).concat([[1, 0], [0, 0]]), { fill: 'gold', fillAlpha: 0.45, stroke: false, close: true });
            Bs.path(pts(Y), { color: 'green', width: 2.2 });
            Bs.path(pts(FG), { color: 'gold', width: 2 });
            const iFG = M.mean(FG), iY = M.mean(Y);
            Bs.texPx(`\\textstyle\\int FG = ${v.fix(iFG, 3)} \\;\\le\\; \\int\\big(\\frac{F^p}{p}+\\frac{G^q}{q}\\big) = ${v.fix(iY, 3)}`, Bs.width - 10, 8, { color: 'green', align: 'right', baseline: 'top', size: 14 });
            // chart: Hölder ratio over p
            C.setView([1, 6.2], [0, 1.3]);
            C.hline(1, { color: 'green', dash: [6, 4], width: 1.5 });
            const ps = M.linspace(1.03, 6.2, 90);
            const ratio = (pp) => { const qq = pp / (pp - 1); return M.mean(fv.map((a, i) => a * gv[i])) / (norm(fv, pp) * norm(gv, qq)); };
            C.path(ps.map((pp) => [pp, ratio(pp)]), { color: 'accent', width: 2.2 });
            C.vline(p, { color: 'muted', width: 1, dash: [3, 3] });
            C.dot(p, ratio(p), { color: 'accent', r: 5 });
            C.texPx('\\text{the ratio } \\textstyle\\int fg\\,/\\,\\|f\\|_p\\|g\\|_q \\text{ for every } p \\text{ — never above } 1', 12, 8, { color: 'muted', align: 'left', baseline: 'top', size: 14 });
            st = { mode: 'h', p, q, ifg: M.mean(fv.map((a, i) => a * gv[i])), nf, ng, r: ratio(p) };
            v.legend([['accent', '$f$'], ['orange', '$g$'], ['gold', '$FG$', { area: true }], ['green', '$F^p/p+G^q/q$ (integral $=1$)']]);
          } else {
            const hv = fv.map((a, i) => a + gv[i]);
            const t1 = fv.map((a, i) => a * hv[i] ** (p - 1)), t2 = gv.map((b, i) => b * hv[i] ** (p - 1));
            const top = Math.max(0.5, ...hv.map((h) => h ** p)) * 1.2;
            Bs.setView(null, [-top * 0.13, top]);
            Bs.setTitle('$(f+g)^p = f(f+g)^{p-1} + g(f+g)^{p-1}$');
            const pts = (arr) => X.map((x, i) => [x, arr[i]]);
            Bs.path(pts(t1).concat([[1, 0], [0, 0]]), { fill: 'accent', fillAlpha: 0.3, stroke: false, close: true });
            Bs.path(pts(t1).concat(pts(t1.map((a, i) => a + t2[i])).reverse()), { fill: 'orange', fillAlpha: 0.3, stroke: false, close: true });
            Bs.path(pts(hv.map((h) => h ** p)), { color: 'green', width: 2.2 });
            const I = M.mean(hv.map((h) => h ** p)), I1 = M.mean(t1), I2 = M.mean(t2);
            Bs.texPx(`\\textstyle\\int(f+g)^p = ${v.fix(I1, 3)} + ${v.fix(I2, 3)} = ${v.fix(I, 3)}`, Bs.width - 10, 8, { color: 'green', align: 'right', baseline: 'top', size: 14 });
            // chart: the two sides of Minkowski for p in [0.25, 6]
            const ps = M.linspace(0.25, 6.2, 120);
            const lhs = ps.map((pp) => norm(hv, pp)), rhs = ps.map((pp) => norm(fv, pp) + norm(gv, pp));
            const hiY = Math.max(...lhs, ...rhs) * 1.08, loY = Math.min(...lhs, ...rhs) * 0.9;
            C.setView([0.25, 6.2], [loY, hiY]);
            C.vband(0.25, 1, { color: 'red', alpha: 0.08 });
            C.vline(1, { color: 'red', width: 1, dash: [3, 3] });
            C.text('p < 1: reversed', 0.3, hiY - (hiY - loY) * 0.08, { color: 'red', size: 11.5 });
            C.path(ps.map((pp, i) => [pp, rhs[i]]), { color: 'accent', width: 2.2 });
            C.path(ps.map((pp, i) => [pp, lhs[i]]), { color: 'green', width: 2.2 });
            C.vline(p, { color: 'muted', width: 1, dash: [3, 3] });
            C.dot(p, norm(hv, p), { color: 'green', r: 4.5 }); C.dot(p, norm(fv, p) + norm(gv, p), { color: 'accent', r: 4.5 });
            st = { mode: 'm', p, nh: norm(hv, p), nf: norm(fv, p), ng: norm(gv, p) };
            v.legend([['accent', '$f$, and $\\|f\\|_p+\\|g\\|_p$ (chart)'], ['orange', '$g$'], ['green', '$f+g$, and $\\|f+g\\|_p$ (chart)'], ['accent', '$f(f+g)^{p-1}$', { area: true }], ['orange', '$g(f+g)^{p-1}$', { area: true }]]);
          }
        });
        v.readout(() => st.mode === 'h'
          ? `$p=${v.fix(st.p, 2)},\\ q=${v.fix(st.q, 3)}$: $\\;\\int fg = ${v.fix(st.ifg, 4)} \\;\\le\\; \\|f\\|_p\\|g\\|_q = ${v.fix(st.nf, 3)}\\cdot${v.fix(st.ng, 3)} = ${v.fix(st.nf * st.ng, 4)}$ $\\;$(ratio $${v.fix(st.r, 4)}$)`
          : `$p=${v.fix(st.p, 2)}$: $\\;\\|f+g\\|_p = ${v.fix(st.nh, 4)} \\;\\le\\; \\|f\\|_p+\\|g\\|_p = ${v.fix(st.nf, 3)}+${v.fix(st.ng, 3)} = ${v.fix(st.nf + st.ng, 4)}$`);
      },
    },
  ],
};
