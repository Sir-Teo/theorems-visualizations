// Rudin, Functional Analysis — Chapter 3: Convexity

// ---------------------------------------------------------------- shared helpers (planar convex geometry)
const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
/** Clip a convex polygon to the half-plane {x : a·x ≤ b} (Sutherland–Hodgman). */
function clipHalf(poly, a, b) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = dot2(a, P) - b, fq = dot2(a, Q) - b;
    if (fp <= 0) out.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  return out;
}
/** The polygon {x : a·x ≤ 1 for every a ∈ A}, clipped to the box [−R, R]². */
function polarOf(A, R = 60) {
  let P = [[-R, -R], [R, -R], [R, R], [-R, R]];
  for (const a of A) { P = clipHalf(P, a, 1); if (!P.length) break; }
  return P;
}
/** Support function h_D(x) = max_{d ∈ D} d·x. */
const supp = (D, x) => { let m = -Infinity; for (const d of D) { const s = dot2(d, x); if (s > m) m = s; } return m; };
/** For a CCW convex polygon with 0 in its interior: vectors a_i with polygon = {x : a_i·x ≤ 1}. */
function facetVectors(poly) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const n = [Q[1] - P[1], -(Q[0] - P[0])], h = dot2(n, P);
    if (h > 1e-12) out.push([n[0] / h, n[1] / h]);
  }
  return out;
}
/** Where the line {x : u·x = c} meets a convex polygon (a 2-point "polygon" = segment). Returns [P, Q] sorted along u⊥, or null. */
function lineCut(poly, u, c) {
  const pts = [], n = poly.length;
  for (let i = 0; i < n; i++) {
    const P = poly[i], Q = poly[(i + 1) % n];
    const fp = dot2(u, P) - c, fq = dot2(u, Q) - c;
    if (Math.abs(fp) < 1e-10) pts.push(P);
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) { const t = fp / (fp - fq); pts.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
  }
  if (!pts.length) return null;
  const w = [-u[1], u[0]];
  pts.sort((a, b) => dot2(w, a) - dot2(w, b));
  return [pts[0], pts[pts.length - 1]];
}
/** Draw the line {x : Λ·x = c} across a stage. */
function levelLine(S, L, c, st) {
  const n2 = dot2(L, L); if (n2 < 1e-14) return;
  const p = [L[0] * c / n2, L[1] * c / n2], t = [-L[1], L[0]], k = 40 / Math.sqrt(n2);
  S.line(p[0] - t[0] * k, p[1] - t[1] * k, p[0] + t[0] * k, p[1] + t[1] * k, st);
}
/** Maximum of a concave function on [a, b] by ternary search. */
function concaveMax(F, a, b, it = 140) {
  for (let i = 0; i < it; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (F(m1) < F(m2)) a = m1; else b = m2; }
  return F((a + b) / 2);
}

export default {
  collection: 'fa',
  chapter: 3,
  title: 'Convexity',
  summary: String.raw`The Hahn–Banach theorems in their many guises — extension of dominated functionals and separation of convex sets by closed hyperplanes — and their consequences: the dual of a locally convex space separates points, weak topologies, the Banach–Alaoglu theorem, the Krein–Milman theorem on extreme points, and vector-valued integration.`,
  items: [
    {
      num: '3.1',
      kind: 'Definition',
      name: 'Dual space',
      statement: String.raw`The **dual space** $X^*$ of a topological vector space $X$ is the vector space of all *continuous* linear functionals $\Lambda$ on $X$, with pointwise operations. A linear functional is continuous exactly when it is bounded on some neighbourhood of $0$. $X^*$ can be trivial (for $L^p([0,1])$ with Lebesgue measure and $0<p<1$ it is $\{0\}$); the Hahn–Banach theorems of this chapter show that it is large whenever $X$ is locally convex.`,
      idea: String.raw`Duality studies a space through the scalar "measurements" it admits. Each $\Lambda\in X^*$ has closed level sets $\{\Lambda=c\}$, a family of parallel hyperplanes; in a normed space its size is $\|\Lambda\|=\sup\{|\Lambda x|:\|x\|\le1\}$, the level at which these hyperplanes first touch the unit ball.`,
      caption: String.raw`$X=\R^2$ with the $\ell^p$ norm. Drag $\Lambda$ in the right panel, where $X^*\cong\R^2$ carries the dual $\ell^q$ norm ($1/p+1/q=1$). On the left its level lines are parallel; the two that touch the unit ball are $\Lambda=\pm\|\Lambda\|$, and the readout checks $\sup_{\|x\|_p\le 1}|\Lambda x| = \|\Lambda\|_q$.`,
      deps: [],
      refs: ['Rudin, Functional Analysis, 2nd ed., §3.1, pp. 56–57'],
      tags: ['duality', 'linear functionals'],
      viz(v) {
        const M = v.M;
        const pS = v.select('norm on $X$', [
          { value: 1, label: '$p=1$' }, { value: 1.5, label: '$p=\\tfrac32$' }, { value: 2, label: '$p=2$' },
          { value: 4, label: '$p=4$' }, { value: Infinity, label: '$p=\\infty$' }], 1.5);
        const L = v.stage({ x: [-2.1, 2.1], y: [-1.7, 1.7], equal: true, height: 320, ticks: false, title: '$X=(\\R^2,\\|\\cdot\\|_p)$: unit ball and level lines of $\\Lambda$' });
        const R = v.stage({ x: [-1.9, 1.9], y: [-1.7, 1.7], equal: true, height: 320, ticks: false, title: '$X^*=(\\R^2,\\|\\cdot\\|_q)$: dual unit ball' });
        const lam = R.handle(1.05, 0.55, { color: 'green', label: 'Λ' });
        let st = {};
        v.render(() => {
          const p = pS.value, q = p === 1 ? Infinity : p === Infinity ? 1 : p / (p - 1);
          const ball = M.unitBall(p, 480), dball = M.unitBall(q, 480);
          const Lv = [lam.x, lam.y];
          let best = 0, xs = ball[0];
          for (const x of ball) { const s = dot2(Lv, x); if (s > best) { best = s; xs = x; } }
          const nq = M.norm(Lv, q);
          for (let k = -9; k <= 9; k++) if (k) levelLine(L, Lv, k * best / 3, { color: 'faint', width: 1, alpha: 0.7 });
          L.poly(ball, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 2 });
          levelLine(L, Lv, best, { color: 'green', width: 2.2 });
          levelLine(L, Lv, -best, { color: 'green', width: 2.2, dash: true });
          L.arrow(0, 0, 0.55 * Lv[0] / Math.hypot(...Lv), 0.55 * Lv[1] / Math.hypot(...Lv), { color: 'green', width: 1.6, head: 8 });
          L.dot(xs[0], xs[1], { color: 'green', r: 4.5, label: 'x*', labelPos: xs[1] >= 0 ? 'ne' : 'se' });
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          L.corner(`Λ = ‖Λ‖ = ${v.fmt(best, 3)}`, 'tl', { color: 'green', weight: 600 });
          R.poly(dball, { fill: 'purple', fillAlpha: 0.14, color: 'purple', width: 2 });
          R.line(0, 0, Lv[0], Lv[1], { color: 'green', width: 1.4, dash: [4, 3] });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          R.corner(`q = ${q === Infinity ? '∞' : v.fmt(q, 3)}`, 'tl', { color: 'purple', weight: 600 });
          st = { best, nq, p, q };
        });
        v.legend([['blue', 'unit ball of $X$', { area: true }], ['purple', 'unit ball of $X^*$', { area: true }], ['green', 'level lines $\\Lambda=\\pm\\|\\Lambda\\|$']]);
        v.readout(() => `$\\sup_{\\|x\\|_p\\le1}|\\Lambda x| = ${v.fix(st.best, 4)}$ (attained at $x^*$) $\\;=\\; \\|\\Lambda\\|_q = ${v.fix(st.nq, 4)}$ — every linear functional on $\\R^2$ is continuous, so here $X^*$ is all of $(\\R^2)'$.`);
      },
    },
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Hahn–Banach extension, dominated form',
      credit: 'Hahn & Banach, 1927',
      statement: String.raw`Let $M$ be a subspace of a real vector space $X$, and let $p:X\to\R$ be sublinear, i.e. $p(x+y)\le p(x)+p(y)$ and $p(tx)=t\,p(x)$ for $x,y\in X$, $t\ge0$. If $f:M\to\R$ is linear and $f(x)\le p(x)$ on $M$, then there is a linear $\Lambda:X\to\R$ with $\Lambda x=f(x)$ on $M$ and
$$-p(-x)\le\Lambda x\le p(x)\qquad(x\in X).$$`,
      idea: String.raw`The heart is a one-dimensional step: to extend $f$ to $M\oplus\R x_1$ one needs a number $\alpha=\Lambda x_1$ with $f(y)-p(y-x_1)\le\alpha\le p(y+x_1)-f(y)$ for all $y\in M$, and subadditivity of $p$ shows that every left-hand side is at most every right-hand side, so such an $\alpha$ exists. Zorn's lemma applied to the dominated extensions, ordered by inclusion, gives a maximal one, which by the step must be defined on all of $X$. The lower bound is $-\Lambda x=\Lambda(-x)\le p(-x)$.`,
      caption: String.raw`$X=\R^2$ and $p$ is the gauge of the convex set $C=\{p\le1\}$ — not symmetric, so $p$ is sublinear but not a seminorm. Turn the line $M$ and set $f$ on it. The extensions $\Lambda$ are exactly the lines $\{\Lambda=1\}$ through the point where $f=1$ that do not cut into $C$ (the fan between the dashed tangents); the last slider chooses $\alpha=\Lambda w$ inside Rudin's interval. Right: $\Lambda$ stays between $-p(-x)$ and $p(x)$ around the unit circle. Push $f(u)$ beyond $p(u)$ and the fan closes.`,
      deps: [],
      see: ['rca-5.16'],
      tags: ['Hahn–Banach', 'sublinear functionals', 'extension'],
      viz(v) {
        const M = v.M;
        const SH = {
          pent: { label: 'pentagon', pts: [[1.3, -0.35], [0.85, 0.95], [-0.45, 1.0], [-0.95, 0.1], [-0.3, -0.85]] },
          egg: { label: 'egg', pts: M.range(96).map((i) => { const t = M.TAU * i / 96, r = 1 + 0.3 * Math.cos(t) + 0.08 * Math.sin(2 * t); return [0.95 * r * Math.cos(t) + 0.12, 0.78 * r * Math.sin(t) + 0.05]; }) },
          tri: { label: 'triangle', pts: [[1.35, -0.55], [-0.35, 1.05], [-0.75, -0.7]] },
        };
        const shape = v.select('$C=\\{p\\le1\\}$', Object.entries(SH).map(([value, o]) => ({ value, label: o.label })), 'pent');
        const ang = v.slider('direction of $M$', 0, 180, 28, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const cS = v.slider('$f(u)$', -2.2, 2.2, 0.55, { step: 0.01 });
        const sS = v.slider('choice of $\\alpha=\\Lambda w$', 0, 1, 0.35, { step: 0.01 });
        const L = v.stage({ x: [-2.7, 2.7], y: [-2.1, 2.1], equal: true, height: 360, ticks: false, title: 'the plane $X=\\R^2$' });
        const R = v.stage({ x: [0, M.TAU], y: [-2, 2], height: 360, axes: true, xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [M.TAU, '2π']], title: 'around the unit circle: $\\theta\\mapsto$ value at $e_\\theta$' });
        let st = {};
        v.render(() => {
          const C = M.hull(SH[shape.value].pts);
          const A = facetVectors(C);
          const p = (x) => supp(A, x);
          const th = ang.value * Math.PI / 180, u = [Math.cos(th), Math.sin(th)], w = [-u[1], u[0]];
          const c = cS.value;
          const seg = lineCut(M.hull(A), u, c);               // all Λ ≤ p with Λu = c
          let Lam = null, aLo = NaN, aHi = NaN, rLo = NaN, rHi = NaN;
          if (seg) {
            aLo = dot2(w, seg[0]); aHi = dot2(w, seg[1]);
            const a = M.lerp(aLo, aHi, sS.value);
            Lam = [c * u[0] + a * w[0], c * u[1] + a * w[1]];
            rLo = concaveMax((t) => c * t - p([t * u[0] - w[0], t * u[1] - w[1]]), -80, 80);
            rHi = -concaveMax((t) => c * t - p([t * u[0] + w[0], t * u[1] + w[1]]), -80, 80);
          }
          // ---- left: the plane
          L.line(-6 * u[0], -6 * u[1], 6 * u[0], 6 * u[1], { color: 'orange', width: 1.8 });
          L.tex('M', 2.35 * u[0] + 0.18 * w[0], 2.35 * u[1] + 0.18 * w[1], { color: 'orange', size: 16 });
          if (seg) {
            const Lm = [c * u[0] + aLo * w[0], c * u[1] + aLo * w[1]], Lp = [c * u[0] + aHi * w[0], c * u[1] + aHi * w[1]];
            levelLine(L, Lm, 1, { color: 'orange', width: 1.3, dash: [6, 4] });
            levelLine(L, Lp, 1, { color: 'orange', width: 1.3, dash: [6, 4] });
          }
          L.poly(C, { fill: 'blue', fillAlpha: 0.17, color: 'blue', width: 2 });
          const far = C[M.argmax(C, (q) => Math.abs(dot2(w, q)))];
          L.tex('C', 0.55 * far[0], 0.55 * far[1], { color: 'blue', size: 18 });
          if (Lam) {
            levelLine(L, Lam, 1, { color: 'green', width: 2.6 });
            const nn = Math.hypot(...Lam), foot = [Lam[0] / nn / nn, Lam[1] / nn / nn];
            L.arrow(foot[0], foot[1], foot[0] + 0.45 * Lam[0] / nn, foot[1] + 0.45 * Lam[1] / nn, { color: 'green', width: 1.6, head: 8 });
            const tg = [-Lam[1] / nn, Lam[0] / nn], mm = Math.abs(c) > 0.02 ? [u[0] / c, u[1] / c] : [9, 9];
            for (const t of [1.3, -1.3, 1.9, -1.9, 0.9, -0.9, 2.5, -2.5]) {
              const q = [foot[0] + t * tg[0] + 0.3 * Lam[0] / nn, foot[1] + t * tg[1] + 0.3 * Lam[1] / nn];
              if (Math.abs(q[0]) < 2.3 && Math.abs(q[1]) < 1.75 && M.dist(q, mm) > 0.8) { L.tex('\\Lambda=1', q[0], q[1], { color: 'green', size: 15 }); break; }
            }
            for (const q of C) if (dot2(Lam, q) > 1 - 1e-6) L.dot(q[0], q[1], { color: 'green', r: 4 });
          }
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          if (Math.abs(c) > 0.02) {
            const m = [u[0] / c, u[1] / c];
            if (Math.abs(m[0]) < 2.6 && Math.abs(m[1]) < 2) L.dot(m[0], m[1], { color: seg ? 'gold' : 'red', r: 5.5, label: 'f = 1', labelPos: m[1] > 0 ? 'nw' : 'sw' });
          }
          if (!seg) L.corner('f(u) violates −p(−u) ≤ f(u) ≤ p(u): no dominated extension', 'tl', { color: 'red', weight: 600 });
          // ---- right: around the circle
          const P = (t) => p([Math.cos(t), Math.sin(t)]), N = (t) => -p([-Math.cos(t), -Math.sin(t)]);
          let top = 0; for (let k = 0; k < 360; k++) { const t = M.TAU * k / 360; top = Math.max(top, P(t), -N(t)); }
          top = Math.max(top, Math.abs(c)) * 1.18;
          R.setView(null, [-top, top]);
          R.between(P, N, 0, M.TAU, { fill: 'blue', fillAlpha: 0.1, n: 360 });
          R.fn(P, { color: 'blue', width: 2, domain: [0, M.TAU] });
          R.fn(N, { color: 'blue', width: 1.6, dash: [5, 4], domain: [0, M.TAU] });
          const t1 = th, t2 = th + Math.PI;
          for (const t of [t1, t2]) R.vline(t, { color: 'orange', width: 1.2, dash: [4, 4] });
          if (Lam) R.fn((t) => Lam[0] * Math.cos(t) + Lam[1] * Math.sin(t), { color: 'green', width: 2.4, domain: [0, M.TAU] });
          R.dot(t1, c, { color: seg ? 'gold' : 'red', r: 5 });
          R.dot(t2, -c, { color: seg ? 'gold' : 'red', r: 5 });
          let worst = -Infinity;
          if (Lam) for (let k = 0; k < 720; k++) { const t = M.TAU * k / 720, x = [Math.cos(t), Math.sin(t)]; worst = Math.max(worst, dot2(Lam, x) - p(x)); }
          st = { seg, aLo, aHi, rLo, rHi, Lam, worst, pu: p(u), pmu: p([-u[0], -u[1]]), c };
        });
        v.legend([['blue', '$p(x)$ and $-p(-x)$'], ['green', 'the extension $\\Lambda$'], ['orange', '$M$ and the extreme admissible $\\Lambda$', { dash: true }], ['gold', '$f$ on $M$', { dot: true }]]);
        v.readout(() => {
          const s = st;
          const head = `$-p(-u) = ${v.fix(-s.pmu, 3)} \\le f(u) = ${v.fix(s.c, 3)} \\le p(u) = ${v.fix(s.pu, 3)}$`;
          if (!s.seg) return `$f(u) = ${v.fix(s.c, 3)}$ lies outside $[-p(-u),\\,p(u)] = [${v.fix(-s.pmu, 3)},\\,${v.fix(s.pu, 3)}]$: $f$ is not dominated by $p$ on $M$, so no extension can exist.`;
          return `${head}. Admissible $\\alpha\\in[${v.fix(s.aLo, 3)},\\,${v.fix(s.aHi, 3)}]$; Rudin's bounds $\\sup_{y\\in M}[f(y)-p(y-w)] = ${v.fix(s.rLo, 3)}$, $\\inf_{y\\in M}[p(y+w)-f(y)] = ${v.fix(s.rHi, 3)}$. Check: $\\max_\\theta(\\Lambda e_\\theta-p(e_\\theta)) = ${v.fix(Math.abs(s.worst) < 5e-4 ? 0 : s.worst, 3)}\\le 0$.`;
        });
      },
    },
    {
      num: '3.3',
      kind: 'Theorem',
      name: 'Hahn–Banach extension for seminorms (real or complex)',
      credit: 'Hahn & Banach, 1927',
      statement: String.raw`Let $M$ be a subspace of a vector space $X$ over $\R$ or $\C$, let $p$ be a seminorm on $X$, and let $f$ be a linear functional on $M$ with $|f(x)|\le p(x)$ for all $x\in M$. Then $f$ extends to a linear functional $\Lambda$ on $X$ with $|\Lambda x|\le p(x)$ for all $x\in X$.`,
      idea: String.raw`Over $\R$, apply 3.2: a seminorm is sublinear and $-p(-x)=-p(x)$, so the two-sided bound becomes $|\Lambda x|\le p(x)$. Over $\C$, write $u=\Re f$; then $f(x)=u(x)-i\,u(ix)$. Extend the real-linear $u$ by the real case to $U$ with $|U|\le p$ and put $\Lambda x=U(x)-iU(ix)$, which is complex-linear and extends $f$. Choosing $|\alpha|=1$ with $\alpha\Lambda x=|\Lambda x|$ gives $|\Lambda x|=U(\alpha x)\le p(\alpha x)=p(x)$.`,
      caption: String.raw`A real picture in $X=\R^2$. Left: the unit ball $\{p\le1\}$ of the chosen seminorm, the line $M$, and the points $\pm m$ where $f=\pm1$; each extension $\Lambda$ gives a strip $\{|\Lambda|\le 1\}$ (green) that must contain the ball. Right, in $X^*$: the dual ball $\{\Lambda:|\Lambda|\le p\}$ and the line of functionals that agree with $f$ on $M$; their intersection (green) is the set of **all** extensions. Drag $\Lambda$ along it, try the degenerate seminorm $|x_1|$, and push $\|f\|$ past $1$.`,
      deps: ['fa-3.2'],
      see: ['rca-5.16'],
      tags: ['Hahn–Banach', 'seminorms', 'extension'],
      viz(v) {
        const M = v.M;
        const SEMI = {
          l1: { label: '$\\ell^1$', D: [[1, 1], [1, -1], [-1, 1], [-1, -1]] },
          l2: { label: '$\\ell^2$', D: M.range(160).map((i) => [Math.cos(M.TAU * i / 160), Math.sin(M.TAU * i / 160)]) },
          linf: { label: '$\\ell^\\infty$', D: [[1, 0], [-1, 0], [0, 1], [0, -1]] },
          hex: { label: 'hexagon', D: M.range(6).map((i) => [1.1 * Math.cos(Math.PI * i / 3 + 0.3), 1.1 * Math.sin(Math.PI * i / 3 + 0.3)]) },
          deg: { label: '$|x_1|$', D: [[1, 0], [-1, 0]] },
        };
        const which = v.select('seminorm $p$', Object.entries(SEMI).map(([value, o]) => ({ value, label: o.label })), 'l1');
        const ang = v.slider('direction of $M$', 0, 180, 24, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const rS = v.slider('$\\sup_{M}|f|/p$', 0, 1.3, 0.8, { step: 0.01 });
        const L = v.stage({ x: [-2.5, 2.5], y: [-2, 2], equal: true, height: 330, ticks: false, title: '$X=\\R^2$: ball $\\{p\\le1\\}$, strip $\\{|\\Lambda|\\le1\\}$' });
        const R = v.stage({ x: [-1.9, 1.9], y: [-1.6, 1.6], equal: true, height: 330, ticks: false, title: '$X^*$: all extensions $=$ dual ball $\\cap\\{\\Lambda|_M=f\\}$' });
        let seg = null, sPos = 0.5, st = {};
        const proj = (x, y) => {
          if (!seg) return [x, y];
          const [P, Q] = seg, d = [Q[0] - P[0], Q[1] - P[1]], dd = dot2(d, d);
          sPos = dd < 1e-12 ? 0.5 : M.clamp(((x - P[0]) * d[0] + (y - P[1]) * d[1]) / dd, 0, 1);
          return [P[0] + sPos * d[0], P[1] + sPos * d[1]];
        };
        const lam = R.handle(0, 0, { color: 'green', label: 'Λ', constrain: proj });
        v.render(() => {
          const D = SEMI[which.value].D, Dh = M.hull(D);
          const p = (x) => supp(D, x);
          const th = ang.value * Math.PI / 180, u = [Math.cos(th), Math.sin(th)];
          const pu = p(u), c = rS.value * pu;
          seg = lineCut(Dh, u, c);
          const ball = polarOf(D);
          // left panel
          L.poly(ball, { fill: 'blue', fillAlpha: 0.16, color: 'blue', width: 2 });
          L.line(-6 * u[0], -6 * u[1], 6 * u[0], 6 * u[1], { color: 'orange', width: 1.8 });
          L.tex('M', 2.2 * u[0] - 0.2 * u[1], 2.2 * u[1] + 0.2 * u[0], { color: 'orange', size: 16 });
          let Lam = null;
          if (seg) {
            const d = [seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]];
            Lam = [seg[0][0] + sPos * d[0], seg[0][1] + sPos * d[1]];
            lam.x = Lam[0]; lam.y = Lam[1]; lam.visible = true;
            if (Math.hypot(...d) > 1e-6) for (const E of seg) { levelLine(L, E, 1, { color: 'orange', width: 1.1, dash: [5, 4], alpha: 0.55 }); levelLine(L, E, -1, { color: 'orange', width: 1.1, dash: [5, 4], alpha: 0.55 }); }
            if (Math.hypot(...Lam) > 1e-9) {
              let strip = [[-60, -60], [60, -60], [60, 60], [-60, 60]];
              strip = clipHalf(strip, Lam, 1); strip = clipHalf(strip, [-Lam[0], -Lam[1]], 1);
              L.poly(strip, { fill: 'green', fillAlpha: 0.1, stroke: false });
              levelLine(L, Lam, 1, { color: 'green', width: 2.3 }); levelLine(L, Lam, -1, { color: 'green', width: 2.3 });
            }
          } else lam.visible = false;
          if (c > 1e-3) for (const sg of [1, -1]) { const m = [sg * u[0] / c, sg * u[1] / c]; if (Math.abs(m[0]) < 2.4 && Math.abs(m[1]) < 1.95) L.dot(m[0], m[1], { color: seg ? 'gold' : 'red', r: 5, label: sg > 0 ? 'f = 1' : 'f = −1', labelPos: (m[1] > 0) === (sg > 0) ? 'nw' : 'se' }); }
          L.dot(0, 0, { color: 'ink', r: 2.5 });
          if (!seg) L.corner('|f| ≤ p fails on M — no extension', 'tl', { color: 'red', weight: 600 });
          // right panel
          if (Dh.length > 2) R.poly(Dh, { fill: 'purple', fillAlpha: 0.14, color: 'purple', width: 2 });
          else R.line(Dh[0][0], Dh[0][1], Dh[1][0], Dh[1][1], { color: 'purple', width: 5, alpha: 0.6 });
          levelLine(R, u, c, { color: 'orange', width: 1.6 });
          if (seg) R.line(seg[0][0], seg[0][1], seg[1][0], seg[1][1], { color: 'green', width: 5, alpha: 0.75 });
          R.dot(0, 0, { color: 'ink', r: 2.5 });
          let supB = 0; if (Lam) for (const x of ball) supB = Math.max(supB, Math.abs(dot2(Lam, x)));
          st = { pu, c, seg, Lam, supB, len: seg ? M.dist(seg[0], seg[1]) : 0 };
        });
        v.legend([['blue', 'ball $\\{p\\le1\\}$', { area: true }], ['purple', 'dual ball $\\{|\\Lambda|\\le p\\}$', { area: true }], ['orange', '$M$; functionals equal to $f$ on $M$'], ['green', 'extensions $\\Lambda$']]);
        v.readout(() => {
          const s = st;
          if (!s.seg) return `$p(u)=${v.fix(s.pu, 3)}$ but $|f(u)| = ${v.fix(s.c, 3)}$: the hypothesis $|f|\\le p$ on $M$ fails and the orange line misses the dual ball.`;
          const kind = s.len > 1e-6 ? `a segment of length $${v.fix(s.len, 3)}$ — not unique` : 'a single point — the extension is unique';
          return `$f(u)=${v.fix(s.c, 3)}$, $p(u)=${v.fix(s.pu, 3)}$. Extensions: ${kind}. Chosen $\\Lambda=(${v.fix(s.Lam[0], 3)},\\,${v.fix(s.Lam[1], 3)})$ has $\\sup_{p(x)\\le1}|\\Lambda x| = ${v.fix(s.supB, 3)}\\le 1$.`;
        });
      },
    },
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Hahn–Banach separation theorem',
      credit: 'Hahn & Banach, 1927',
      statement: String.raw`Let $A$ and $B$ be disjoint, nonempty, convex subsets of a topological vector space $X$.
(a) If $A$ is open, there exist $\Lambda\in X^*$ and $\gamma\in\R$ with $\Re\Lambda x<\gamma\le\Re\Lambda y$ for all $x\in A$, $y\in B$.
(b) If $A$ is compact, $B$ is closed, and $X$ is locally convex, there exist $\Lambda\in X^*$ and $\gamma_1<\gamma_2$ with $\Re\Lambda x<\gamma_1<\gamma_2<\Re\Lambda y$ for all $x\in A$, $y\in B$.`,
      idea: String.raw`For (a), the set $A-B$ is convex and open and misses $0$; its Minkowski functional dominates a functional defined on a line, and the Hahn–Banach extension (3.2) gives $\Lambda$ that is negative on $A-B$. For (b), local convexity yields a convex neighbourhood $V$ of $0$ with $(A+V)\cap B=\emptyset$; apply (a) to the open set $A+V$, and compactness of $A$ turns $\le$ into a strict gap.`,
      caption: String.raw`Drag the disc $A$ and the vertices of the polygon $B$ (its convex hull is used). The faint parallel lines are level sets $\{\Re\Lambda = c\}$ of the separating functional; the shaded slab is the gap $\gamma_1 < \Re\Lambda < \gamma_2$. Push the sets together and the slab collapses — no functional can separate overlapping sets.`,
      deps: ['fa-3.2', 'fa-1.35', 'fa-1.10'],
      tags: ['Hahn–Banach', 'convexity', 'duality'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-3.2, 3.2], y: [-2.1, 2.1], equal: true, height: 380, axes: false });
        const showLevels = v.toggle('level sets of $\\Re\\Lambda$', true);
        const a = S.handle(-1.3, 0.2, { color: 'blue', label: 'A' });
        const rA = v.slider('radius of $A$', 0.2, 1.2, 0.7, { step: 0.01 });
        let state = {};
        const B = [[0.9, -1.3], [2.4, -0.6], [2.1, 1.2], [0.7, 0.9]].map(([x, y]) => S.handle(x, y, { color: 'red', r: 6 }));

        v.render(() => {
          const hull = M.hull(B.map((h) => [h.x, h.y]));
          const c = [a.x, a.y], r = rA.value;
          const q = M.closestOnConvexPoly(c, hull);
          const d = M.dist(c, q);
          const sep = d > r + 1e-9;
          if (sep) {
            const n = M.normalize(M.vsub(q, c));            // Λx = <n, x>
            const g1 = M.dot(n, c) + r, g2 = M.dot(n, q);   // sup over A, inf over B
            const t = [-n[1], n[0]], L = 12;
            const lineAt = (g, st) => { const p = M.vscale(n, g); S.line(p[0] - t[0] * L, p[1] - t[1] * L, p[0] + t[0] * L, p[1] + t[1] * L, st); };
            if (showLevels.value) for (let k = -14; k <= 14; k++) lineAt((g1 + g2) / 2 + k * 0.35, { color: 'faint', width: 1, alpha: 0.6 });
            // slab between γ1 and γ2
            const p1 = M.vscale(n, g1), p2 = M.vscale(n, g2);
            S.poly([M.vadd(p1, M.vscale(t, L)), M.vadd(p2, M.vscale(t, L)), M.vadd(p2, M.vscale(t, -L)), M.vadd(p1, M.vscale(t, -L))], { fill: 'green', fillAlpha: 0.13, stroke: false });
            lineAt(g1, { color: 'green', width: 1.6, dash: true });
            lineAt(g2, { color: 'green', width: 1.6, dash: true });
            lineAt((g1 + g2) / 2, { color: 'green', width: 2.4 });
            const mid = M.vadd(M.vscale(n, (g1 + g2) / 2), M.vscale(t, 1.55));
            S.arrow(mid[0], mid[1], mid[0] + n[0] * 0.6, mid[1] + n[1] * 0.6, { color: 'green', head: 9 });
            S.tex('\\Lambda', mid[0] + n[0] * 0.75, mid[1] + n[1] * 0.75, { color: 'green' });
            const ca = M.vadd(c, M.vscale(n, r));
            S.line(ca[0], ca[1], q[0], q[1], { color: 'muted', width: 1.2, dash: [2, 3] });
            S.dot(ca[0], ca[1], { color: 'blue', r: 3.5 }); S.dot(q[0], q[1], { color: 'red', r: 3.5 });
            state = { sep, g1, g2 };
          } else state = { sep };
          S.circle(c[0], c[1], r, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2 });
          S.poly(hull, { fill: 'red', fillAlpha: 0.18, color: 'red', width: 2 });
          if (!sep) S.corner('A ∩ B ≠ ∅ — no separating functional', 'tl', { color: 'red', weight: 600 });
          const cb = hull.reduce((s, p) => M.vadd(s, M.vscale(p, 1 / hull.length)), [0, 0]);
          S.tex('B', cb[0], cb[1], { color: 'red', size: 18 });
        });
        v.readout(() => {
          const s = state;
          return s.sep ? `$\\sup_A \\Re\\Lambda = \\gamma_1 = ${v.fix(s.g1, 3)} \\;<\\; \\gamma_2 = ${v.fix(s.g2, 3)} = \\inf_B \\Re\\Lambda$ — gap $${v.fix(s.g2 - s.g1, 3)}$`
            : 'The sets meet, so the hypotheses fail and no closed hyperplane separates them.';
        });
      },
    },
    {
      num: '3.4a',
      kind: 'Corollary',
      name: 'The dual of a locally convex space separates points',
      statement: String.raw`If $X$ is a locally convex space, then $X^*$ separates points on $X$: whenever $x_1\ne x_2$ in $X$, some $\Lambda\in X^*$ has $\Lambda x_1\ne\Lambda x_2$.`,
      idea: String.raw`Points are closed (topological vector spaces are Hausdorff in Rudin's convention) and compact, so 3.4(b) separates $A=\{x_1\}$ from $B=\{x_2\}$: $\Re\Lambda x_1<\Re\Lambda x_2$. Local convexity cannot be dropped: in $L^p$ with $0<p<1$ every function is an average of $n$ "spikes" whose distance to $0$ tends to $0$, so every convex neighbourhood of $0$ is the whole space and the only continuous linear functional is $0$.`,
      caption: String.raw`Two different functions $f\ne g$ on $[0,1]$. In $C[0,1]$ drag the bump $\varphi$ along the axis: $\Lambda_\varphi h=\int_0^1 h\varphi$ separates $f$ from $g$ as soon as $\varphi$ overlaps the place where they differ (lower panel: $\Lambda_\varphi g-\Lambda_\varphi f$ as a function of the bump's centre). Switch to $L^{1/2}$: $h=g-f$ is the average of the $n$ spikes $g_k=n\,h\,\chi_{I_k}$, and their distances $d(g_k,0)=\int|g_k|^{1/2}$ shrink like $n^{-1/2}$.`,
      deps: ['fa-3.4'],
      see: ['rca-5.20'],
      tags: ['Hahn–Banach', 'duality', 'local convexity'],
      viz(v) {
        const M = v.M;
        const f = (t) => 0.55 + 0.2 * Math.sin(2 * Math.PI * t);
        const h = (t) => 0.42 * Math.exp(-(((t - 0.64) / 0.075) ** 2));
        const g = (t) => f(t) + h(t);
        const mode = v.select('', [{ value: 'C', label: '$C[0,1]$ (locally convex)' }, { value: 'L', label: '$L^{1/2}$ (not locally convex)' }], 'C');
        const nS = v.slider('number of spikes $n$', 2, 40, 7, { int: true });
        const XT = [0.2, 0.4, 0.6, 0.8, 1];
        const top = v.stage({ x: [-0.02, 1.02], y: [-0.16, 1.4], height: 250, full: true, axes: 'box', xlabel: 't', xticks: XT });
        const bot = v.stage({ x: [-0.02, 1.02], y: [-0.02, 0.1], height: 170, full: true, axes: 'box', xticks: XT });
        const s = top.handle(0.5, 0, { color: 'green', constrain: (x) => [M.clamp(x, 0.06, 0.94), 0] });
        const W = 0.05, Z = W * Math.sqrt(Math.PI);
        const phi = (c) => (t) => Math.exp(-(((t - c) / W) ** 2)) / Z;
        const lam = (c, F) => M.integrate((t) => F(t) * phi(c)(t), Math.max(0, c - 5 * W), Math.min(1, c + 5 * W), 200);
        let st = {};
        v.render(() => {
          if (mode.value === 'C') {
            s.visible = true;
            top.setView(null, [-0.16, 1.4]);
            top.fn((t) => 1.1 * Z * phi(s.x)(t), { color: 'green', width: 1.4, fill: 'green', fillAlpha: 0.15, domain: [0, 1] });
            top.fn(f, { color: 'blue', width: 2.4, domain: [0, 1] });
            top.fn(g, { color: 'red', width: 2.4, domain: [0, 1] });
            top.tex('f', 0.1, f(0.1) - 0.11, { color: 'blue' });
            top.tex('g', 0.66, g(0.66) + 0.11, { color: 'red' });
            top.tex('\\varphi\\ \\text{(scaled)}', s.x + 0.04, 1.12, { color: 'green', align: 'left', size: 14 });
            const cs = M.linspace(0.06, 0.94, 160), ds = cs.map((c) => lam(c, h));
            const hi = Math.max(...ds) * 1.25;
            bot.setView(null, [-hi * 0.12, hi]);
            bot.setTitle('$\\Lambda_\\varphi g-\\Lambda_\\varphi f$ against the centre of $\\varphi$');
            bot.path(cs.map((c, i) => [c, ds[i]]), { color: 'green', width: 2.2 });
            const d = lam(s.x, h);
            bot.vline(s.x, { color: 'green', width: 1, dash: [3, 3] });
            bot.dot(s.x, d, { color: d > 1e-3 ? 'green' : 'muted', r: 5 });
            v.legend([['blue', '$f$'], ['red', '$g$'], ['green', 'test function $\\varphi$ (drag its centre)', { area: true }]]);
            st = { mode: 'C', lf: lam(s.x, f), lg: lam(s.x, g), d };
          } else {
            s.visible = false;
            const n = nS.value;
            const edges = M.linspace(0, 1, n + 1);
            const dk = [], hk = [];
            for (let k = 0; k < n; k++) {
              const a = edges[k], b = edges[k + 1];
              dk.push(Math.sqrt(n) * M.integrate((t) => Math.sqrt(h(t)), a, b, 60));
              hk.push(n * M.integrate(h, a, b, 60) / (b - a));
            }
            const H = Math.max(1.3, Math.max(...hk) * 1.12);
            top.setView(null, [-0.1 * H, H]);
            for (let k = 0; k < n; k++) if (hk[k] > 1e-3) {
              const a = edges[k], b = edges[k + 1];
              top.fn((t) => n * h(t), { domain: [a, b], color: 'gold', width: 1.4, fill: 'gold', fillAlpha: 0.3 });
            }
            for (const e of edges) top.vline(e, { color: 'grid', width: 1 });
            top.fn(h, { color: 'ink', width: 2.6, domain: [0, 1] });
            top.tex('h=g-f', 0.82, 0.5, { color: 'ink' });
            const dmax = Math.max(...dk);
            bot.setView(null, [-0.1 * Math.max(0.05, dmax * 1.25), Math.max(0.05, dmax * 1.25)]);
            bot.setTitle('distance to $0$ of each spike: $d(g_k,0)=\\int_0^1|g_k|^{1/2}$');
            bot.bars(dk, { x0: 0.5 / n, dx: 1 / n, color: 'gold', barWidth: 0.8 });
            bot.hline(dmax, { color: 'red', dash: [5, 4], width: 1.4 });
            v.legend([['ink', '$h=g-f$'], ['gold', 'spikes $g_k$, with $h=\\frac1n\\sum_k g_k$', { area: true }], ['red', '$\\max_k d(g_k,0)$', { dash: true }]]);
            st = { mode: 'L', n, dmax, tot: M.integrate((t) => Math.sqrt(h(t)), 0, 1, 400) };
          }
        });
        v.readout(() => {
          const r = st;
          if (r.mode === 'C') return `$\\Lambda_\\varphi f = ${v.fix(r.lf, 4)}$, $\\;\\Lambda_\\varphi g = ${v.fix(r.lg, 4)}$ — ` + (r.d > 1e-3 ? 'this continuous functional separates $f$ and $g$.' : 'these agree to 3 decimals; move $\\varphi$ toward $t\\approx 0.64$.');
          return `$n=${r.n}$: every spike satisfies $d(g_k,0)\\le ${v.fix(r.dmax, 4)}$ (and $\\to0$ like $n^{-1/2}$), yet $h$ is their average. So $h$ lies in every convex neighbourhood of $0$, any continuous $\\Lambda$ has $|\\Lambda h|\\le\\max_k|\\Lambda g_k|\\to0$, and $X^*=\\{0\\}$ cannot separate $f$ from $g$.`;
        });
      },
    },
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Functionals vanishing on a non-dense subspace',
      statement: String.raw`Let $M$ be a subspace of a locally convex space $X$ and let $x_0\in X$. If $x_0$ is not in the closure $\overline M$, then there is $\Lambda\in X^*$ with $\Lambda x_0=1$ and $\Lambda x=0$ for every $x\in M$.`,
      idea: String.raw`$\overline M$ is a closed subspace, hence closed and convex, and $\{x_0\}$ is compact, so 3.4(b) gives $\Lambda$ with $\Lambda x_0$ outside the closure of $\Lambda(M)$. But $\Lambda(M)$ is a subspace of the scalar field, hence $\{0\}$ or everything; it must be $\{0\}$. Then $\Lambda x_0\ne0$ and we divide by it. Read in reverse this is a density test: $M$ is dense iff the only $\Lambda\in X^*$ vanishing on $M$ is $0$.`,
      caption: String.raw`$X=C[0,1]$ with the sup norm and $M_n=\spn\{x,x^2,\dots,x^n\}$; the union of all $M_n$ is dense in $\{h:h(0)=0\}$. For $x_0=g$ with $g(0)\neq0$, $\Lambda=\delta_0/g(0)$ vanishes on $M$ and $\Lambda g=1$, which certifies a gap: no element of $M$ is closer to $g$ than $|g(0)|$ (green line), however large $n$ is. The blue curve is the least-squares fit from $M_n$. Pick a $g$ with $g(0)=0$ and the errors fall towards $0$: then $x_0\in\overline M$ and no such $\Lambda$ exists.`,
      deps: ['fa-3.4'],
      see: ['rca-5.19'],
      tags: ['Hahn–Banach', 'density', 'subspaces'],
      viz(v) {
        const M = v.M;
        const G = {
          exp: { label: '$e^{x}$', f: Math.exp, y: [-0.35, 2.95] },
          cos: { label: '$\\cos 5x$', f: (x) => Math.cos(5 * x), y: [-1.45, 1.45] },
          sin: { label: '$\\sin 5x$', f: (x) => Math.sin(5 * x), y: [-1.45, 1.45] },
          sqrt: { label: '$\\sqrt{x}$', f: Math.sqrt, y: [-0.25, 1.25] },
        };
        const which = v.select('$x_0=g=$', Object.entries(G).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const nS = v.slider('$n=\\dim M_n$', 1, 14, 5, { int: true });
        const top = v.stage({ x: [-0.04, 1.03], y: [-0.35, 2.95], height: 280, full: true, axes: 'box', xlabel: 'x', xticks: [0.2, 0.4, 0.6, 0.8, 1] });
        const bot = v.stage({ x: [0.3, 14.7], y: [0, 1], height: 160, full: true, axes: 'box', xticks: M.range(14, 1), title: 'sup-norm error $\\|g-p_k\\|_\\infty$ of the fit from $M_k$, $k=1,\\dots,14$' });
        const xs = M.linspace(0, 1, 301);
        const basis = (k, x) => x * M.chebyshevT(k, 2 * x - 1);
        const cache = {};
        function fits(key) {
          if (cache[key]) return cache[key];
          const g = G[key].f, ys = xs.map(g), out = [];
          for (let n = 1; n <= 14; n++) {
            const B = xs.map((x) => M.range(n).map((k) => basis(k, x)));
            const A = M.range(n).map((i) => M.range(n).map((j) => M.sum(B, (r) => r[i] * r[j])));
            const b = M.range(n).map((i) => M.sum(B, (r, m) => r[i] * ys[m]));
            const c = M.solve(A, b) || M.range(n).map(() => 0);
            const p = (x) => M.sum(c, (ck, k) => ck * basis(k, x));
            const err = Math.max(...xs.map((x, m) => Math.abs(ys[m] - p(x))));
            out.push({ p, err });
          }
          return (cache[key] = out);
        }
        let st = {};
        v.render(() => {
          const key = which.value, g = G[key].f, n = nS.value, F = fits(key), p = F[n - 1].p;
          top.setView(null, G[key].y);
          top.between(g, p, 0, 1, { fill: 'red', fillAlpha: 0.1 });
          top.fn(g, { color: 'ink', width: 2.4, domain: [0, 1] });
          top.fn(p, { color: 'blue', width: 2.2, domain: [0, 1] });
          const g0 = g(0);
          if (Math.abs(g0) > 1e-9) top.measure(0.012, 0, 0.012, g0, '', { color: 'green' });
          top.dot(0, g0, { color: 'ink', r: 4.5 });
          top.dot(0, 0, { color: 'blue', r: 4.5 });
          if (Math.abs(g0) > 1e-9) top.tex(`|g(0)| = ${v.fix(Math.abs(g0), 2)}`, 0.03, g0 * 0.72, { color: 'green', align: 'left', size: 14, dx: 4 });
          top.tex('g', 0.93, g(0.93), { color: 'ink', dy: -14 });
          top.tex(`p_{${n}}\\in M_{${n}}`, 0.6, p(0.6), { color: 'blue', dy: 18, align: 'left' });
          const errs = F.map((o) => o.err), hi = Math.max(Math.abs(g0), ...errs) * 1.18;
          bot.setView(null, [0, hi]);
          bot.bars(errs, { x0: 1, dx: 1, color: (e, i) => (i === n - 1 ? 'blue' : 'faint'), barWidth: 0.5 });
          if (Math.abs(g0) > 1e-9) { bot.hline(Math.abs(g0), { color: 'green', width: 1.8, dash: [6, 4] }); bot.text('lower bound |Λx₀| / ‖Λ‖ = |g(0)|', 14.5, Math.abs(g0), { align: 'right', dy: -9, color: 'green', size: 11.5 }); }
          st = { g0, err: F[n - 1].err, n };
        });
        v.legend([['ink', '$x_0=g$'], ['blue', 'least-squares fit $p_n\\in M_n$'], ['green', 'gap certified by $\\Lambda=\\delta_0/g(0)$', { dash: true }]]);
        v.readout(() => {
          const s = st;
          if (Math.abs(s.g0) > 1e-9) return `$\\Lambda=\\delta_0/g(0)$: $\\Lambda|_M=0$, $\\Lambda x_0=1$, $\\|\\Lambda\\|=${v.fix(1 / Math.abs(s.g0), 3)}$. Hence $\\|x_0-p\\|_\\infty\\ge 1/\\|\\Lambda\\| = ${v.fix(Math.abs(s.g0), 3)}$ for every $p\\in M$ — the fit from $M_{${s.n}}$ has error $${v.fix(s.err, 3)}$. So $x_0\\notin\\overline M$.`;
          return `$g(0)=0$: the fit from $M_{${s.n}}$ has error $${v.fix(s.err, 4)}$, and the errors tend to $0$, so $x_0\\in\\overline M$. Every $\\Lambda\\in X^*$ that vanishes on $M$ also vanishes at $x_0$ — the conclusion of 3.5 is impossible here.`;
        });
      },
    },
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'Continuous functionals extend from subspaces',
      statement: String.raw`If $f$ is a continuous linear functional on a subspace $M$ of a locally convex space $X$, then there exists $\Lambda\in X^*$ with $\Lambda x=f(x)$ for all $x\in M$.`,
      idea: String.raw`Continuity of $f$ at $0$ and local convexity give a convex balanced neighbourhood $V$ of $0$ in $X$ with $|f|<1$ on $M\cap V$. Its Minkowski functional $p=\mu_V$ is a continuous seminorm on $X$ (1.35) and $|f|\le p$ on $M$. Extend by 3.3 to $\Lambda$ with $|\Lambda|\le p$; then $|\Lambda|<1$ on $V$, so $\Lambda$ is continuous. In a normed space take $p=\|f\|\,\|\cdot\|$: the extension keeps the norm.`,
      caption: String.raw`$X=C[-1,1]$, $M=\mathcal P_n$ (polynomials of degree $\le n$), and $f(q)=q(\xi)$ for a point $\xi>1$ outside the interval; on $M$, $\|f\|=T_n(\xi)$ (Chebyshev's extremal property). A norm-preserving extension is the signed measure $\Lambda=\sum_k w_k\,\delta_{x_k}$ on the Chebyshev points $x_k=\cos(k\pi/n)$, with $w_k$ the Lagrange weights at $\xi$: the weights alternate in sign and $\sum|w_k|=T_n(\xi)$. Change $n$, $\xi$ and the test function $g$.`,
      deps: ['fa-3.3', 'fa-1.35'],
      see: ['rca-5.16'],
      tags: ['Hahn–Banach', 'extension', 'Chebyshev'],
      viz(v) {
        const M = v.M;
        const nS = v.slider('$n=\\deg$', 1, 8, 4, { int: true });
        const xiS = v.slider('$\\xi$', 1.01, 1.3, 1.08, { step: 0.01 });
        const QC = [0.2, 0.5, -0.65, 0.3, 0.25, -0.2, 0.1, -0.06, 0.03];
        const G = {
          T: { label: '$T_n$ (extremal)' },
          q: { label: 'a polynomial $q\\in M$' },
          abs: { label: '$|x|\\notin M$' },
          th: { label: '$\\tanh 5x\\notin M$' },
        };
        const which = v.select('test $g$', Object.entries(G).map(([value, o]) => ({ value, label: o.label })), 'T');
        const top = v.stage({ x: [-1.08, 1.36], y: [-1.6, 1.6], height: 270, full: true, axes: 'box', yticks: [-1, -0.5, 0, 0.5, 1], xticks: [-0.5, 0, 0.5, 1], title: 'the space $C[-1,1]$: test function $g$, Chebyshev nodes $x_k$, and the point $\\xi$' });
        const bot = v.stage({ x: [-1.08, 1.36], y: [-1, 1], height: 170, full: true, axes: 'box', xticks: [-0.5, 0, 0.5, 1], title: 'the extension $\\Lambda=\\sum_k w_k\\,\\delta_{x_k}$ (a signed measure on $[-1,1]$)' });
        let st = {};
        v.render(() => {
          const n = nS.value, xi = xiS.value;
          const xk = M.range(n + 1).map((k) => Math.cos(k * Math.PI / n));
          const w = xk.map((x, k) => { let r = 1; for (let j = 0; j <= n; j++) if (j !== k) r *= (xi - xk[j]) / (x - xk[j]); return r; });
          const Tn = (x) => M.chebyshevT(n, x);
          const q = (x) => M.polyEval(QC.slice(0, n + 1), x);
          const gf = { T: Tn, q, abs: Math.abs, th: (x) => Math.tanh(5 * x) }[which.value];
          const interp = M.lagrange(xk, xk.map(gf));
          top.hband(-1, 1, { color: 'blue', alpha: 0.06 });
          top.vband(1, 1.4, { color: 'faint', alpha: 0.18 });
          top.fn(Tn, { domain: [-1, 1], color: 'purple', width: 1.4, alpha: which.value === 'T' ? 0 : 0.55, dash: [5, 4] });
          top.fn(gf, { domain: [-1, 1], color: 'ink', width: 2.4 });
          top.fn(interp, { domain: [1, xi], color: 'blue', width: 2, dash: [5, 4] });
          top.vline(xi, { color: 'orange', width: 1.4, dash: [4, 3] });
          top.text('ξ', xi, -1.2, { color: 'orange', math: true, align: 'left', dx: 4 });
          xk.forEach((x, k) => top.dot(x, gf(x), { color: w[k] >= 0 ? 'green' : 'red', r: 4.5 }));
          const Lg = M.sum(w, (wk, k) => wk * gf(xk[k]));
          if (Math.abs(Lg) < 1.5) top.dot(xi, Lg, { color: 'blue', r: 5, label: 'Λg', labelPos: 'e' });
          else top.text(`Λg = ${v.fmt(Lg, 4)} ↑`, xi, 1.42, { color: 'blue', align: 'right', dx: -6, size: 11.5 });
          const W = Math.max(...w.map(Math.abs)) * 1.2;
          bot.setView(null, [-W, W]);
          xk.forEach((x, k) => { bot.line(x, 0, x, w[k], { color: w[k] >= 0 ? 'green' : 'red', width: 2.6 }); bot.dot(x, w[k], { color: w[k] >= 0 ? 'green' : 'red', r: 4.5 }); });
          bot.vline(xi, { color: 'orange', width: 1.2, dash: [4, 3] });
          const sumAbs = M.sum(w, Math.abs);
          st = { n, xi, Lg, sumAbs, Tx: Tn(xi), inM: which.value === 'T' || which.value === 'q', gxi: which.value === 'q' ? q(xi) : Tn(xi) };
        });
        v.legend([['ink', 'test function $g$'], ['purple', '$T_n$', { dash: true }], ['green', '$w_k>0$', { dot: true }], ['red', '$w_k<0$', { dot: true }], ['blue', 'interpolant continued to $\\xi$', { dash: true }]]);
        v.readout(() => {
          const s = st;
          const val = s.inM ? `$\\Lambda g = ${v.fix(s.Lg, 4)} = g(\\xi)$ (here $g\\in M$, so $\\Lambda$ agrees with $f$)` : `$\\Lambda g = ${v.fix(s.Lg, 4)}$ (the interpolant's value at $\\xi$; $g\\notin M$)`;
          return `${val}. $\\;\\|\\Lambda\\| = \\sum_k|w_k| = ${v.fix(s.sumAbs, 4)}$ and $\\|f\\|_{M} = T_{${s.n}}(\\xi) = ${v.fix(s.Tx, 4)}$ — the extension does not increase the norm.`;
        });
      },
    },
    {
      num: '3.7',
      kind: 'Theorem',
      name: 'Separating a point from a closed balanced convex set',
      statement: String.raw`Let $B$ be a convex, balanced, closed subset of a locally convex space $X$, and let $x_0\in X\setminus B$. Then there is $\Lambda\in X^*$ with $|\Lambda x|\le1$ for all $x\in B$ and $\Lambda x_0>1$.`,
      idea: String.raw`Apply 3.4(b) to the compact set $\{x_0\}$ and the closed convex set $B$: there are $\Lambda_1\in X^*$ and $\gamma$ with $\Re\Lambda_1x<\gamma<\Re\Lambda_1x_0$ on $B$ (note $\gamma>0$ since $0\in B$). Because $B$ is balanced, $|\Lambda_1x|=\Re\Lambda_1(\alpha x)$ for a suitable unimodular $\alpha$ with $\alpha x\in B$, so $|\Lambda_1|\le\gamma$ on $B$. Then $\Lambda_1/\gamma$ is at most $1$ in modulus on $B$ and exceeds $1$ in real part at $x_0$; a unimodular factor makes its value at $x_0$ real and positive.`,
      caption: String.raw`Drag the three blue vertices (the set is $B=\co\{\pm v_1,\pm v_2,\pm v_3\}$) and the point $x_0$. The green strip $\{|\Lambda|\le1\}$ swallows $B$ while $x_0$ lies outside it. Turn **balanced** off: for a convex $B$ that is not balanced the strip has to contain $\co(B\cup-B)$ (dashed), so a point $x_0$ in the red region is outside $B$ yet no $\Lambda$ with $|\Lambda|\le1$ on $B$ and $\Lambda x_0>1$ exists.`,
      deps: ['fa-3.4'],
      tags: ['Hahn–Banach', 'separation', 'polars'],
      viz(v) {
        const M = v.M;
        const S = v.stage({ x: [-2.6, 2.6], y: [-1.85, 1.85], equal: true, height: 380, ticks: false });
        const bal = v.toggle('$B$ balanced', true);
        const V = [[1.15, 0.25], [0.25, 0.9], [-0.75, 0.55]].map(([x, y], i) => S.handle(x, y, { color: 'blue', r: 6, label: `v${'₁₂₃'[i]}` }));
        const x0 = S.handle(1.55, 1.15, { color: 'red', label: 'x₀' });
        let st = {};
        v.render(() => {
          const pts = V.map((h) => [h.x, h.y]);
          const B = M.hull(bal.value ? pts.concat(pts.map(([a, b]) => [-a, -b])) : pts);
          const K = M.hull(B.concat(B.map(([a, b]) => [-a, -b])));
          const X0 = [x0.x, x0.y];
          if (B.length < 3 || Math.abs(M.polyArea(K)) < 1e-6) { S.corner('degenerate set — move a vertex', 'tl', { color: 'red' }); st = {}; return; }
          const A = facetVectors(K);
          let best = -Infinity, Lam = null;
          for (const a of A) { const s = dot2(a, X0); if (s > best) { best = s; Lam = a; } }
          const inB = M.pointInPoly(X0, B);
          if (!bal.value) S.poly(K, { fill: best <= 1 && !inB ? 'red' : 'faint', fillAlpha: best <= 1 && !inB ? 0.16 : 0.08, color: 'muted', width: 1.3, dash: [5, 4] });
          if (best > 1) {
            let strip = [[-60, -60], [60, -60], [60, 60], [-60, 60]];
            strip = clipHalf(strip, Lam, 1); strip = clipHalf(strip, [-Lam[0], -Lam[1]], 1);
            S.poly(strip, { fill: 'green', fillAlpha: 0.1, stroke: false });
            levelLine(S, Lam, 1, { color: 'green', width: 2.3 }); levelLine(S, Lam, -1, { color: 'green', width: 2.3 });
            levelLine(S, Lam, best, { color: 'red', width: 1.2, dash: [4, 4], alpha: 0.7 });
            const nn = Math.hypot(...Lam), f0 = [Lam[0] / nn / nn, Lam[1] / nn / nn];
            S.arrow(f0[0], f0[1], f0[0] + 0.5 * Lam[0] / nn, f0[1] + 0.5 * Lam[1] / nn, { color: 'green', width: 1.6, head: 8 });
            S.tex('\\Lambda = 1', f0[0] + 0.62 * Lam[0] / nn, f0[1] + 0.62 * Lam[1] / nn, { color: 'green', size: 14 });
          } else if (!inB) {
            const q = M.closestOnConvexPoly(X0, B), n = M.normalize(M.vsub(X0, q));
            levelLine(S, n, dot2(n, q), { color: 'orange', width: 1.6, dash: [6, 4] });
          }
          S.poly(B, { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 2 });
          S.dot(0, 0, { color: 'ink', r: 2.5 });
          if (!bal.value) S.tex('\\operatorname{co}(B\\cup -B)', K[M.argmin(K, (p) => p[1])][0], K[M.argmin(K, (p) => p[1])][1], { color: 'muted', size: 13, dy: 12 });
          let supB = 0; for (const b of B) supB = Math.max(supB, Lam ? Math.abs(dot2(Lam, b)) : 0);
          st = { best, inB, supB, Lam, bal: bal.value };
          if (inB) S.corner('x₀ ∈ B — nothing to separate', 'tl', { color: 'muted', weight: 600 });
          else if (best <= 1) S.corner('x₀ ∉ B, but x₀ ∈ co(B ∪ −B): no such Λ', 'tl', { color: 'red', weight: 600 });
        });
        v.legend([['blue', '$B$', { area: true }], ['green', 'strip $\\{|\\Lambda|\\le1\\}$', { area: true }], ['red', 'level line through $x_0$', { dash: true }], ['orange', 'one-sided separation (3.4b) only', { dash: true }]]);
        v.readout(() => {
          const s = st; if (s.best == null) return '';
          if (s.inB) return 'The point lies in $B$; the theorem has nothing to say.';
          if (s.best > 1) return `$\\sup_{x\\in B}|\\Lambda x| = ${v.fix(s.supB, 3)}\\le 1 < ${v.fix(s.best, 3)} = \\Lambda x_0$` + (s.bal ? '.' : ' — this works because $x_0$ is outside $\\operatorname{co}(B\\cup -B)$ too.');
          return `$x_0\\notin B$ but $\\sup\\{\\Lambda x_0 : |\\Lambda|\\le1 \\text{ on } B\\} = ${v.fix(s.best, 3)}\\le1$: without balancedness the conclusion fails, although a one-sided separating line (orange) still exists.`;
        });
      },
    },
  ],
};
