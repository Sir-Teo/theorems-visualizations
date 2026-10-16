// Microeconomics — Chapter 7: Technology and costs (items 7.9–7.15; 7.1–7.8 in ch07.js)
import { clamp, GUIDE, LBL, sgn, fx, argmax, argmin, dif, plateText, slopeLine, scaleFn, tech, drawIsoq, isocost, cminNum, costCurves, sample } from './ch07.shared.js';

/** Vertical bar with a value label above it. */
function bar(s, x, w, y0, y1, col, st = {}) { s.rect(x - w / 2, y0, x + w / 2, y1, { fill: col, fillAlpha: st.fillAlpha ?? 0.75, color: col, width: 1.2, ...st }); }
/** The standard U-shaped homothetic technology of the cost items: f = H(√(LK)), efficient scale 6 (long-run AC minimal at y = 6). */
const UTECH = (P = {}) => tech('hom', { S: scaleFn(P.kind ?? 'U', { ys: 6, e1: 0.25, ...P }), a: 0.5 });

export default {
  collection: 'micro',
  chapter: 7,
  items: [
    // ------------------------------------------------------------------ 7.9
    {
      num: '7.9', kind: 'Theorem', name: 'Envelope theorem',
      statement: String.raw`Let $f(x, a)$ be continuously differentiable, let $x^*(a)$ maximize $f(\cdot, a)$ over an open set (or a fixed set not depending on $a$), and let $V(a) = f(x^*(a), a)$ be the **value function**. If $x^*$ is differentiable in $a$ (for instance a unique interior maximizer with $f_{xx} < 0$, by the implicit function theorem), then
$$V'(a) = \frac{\partial f}{\partial a}\big(x^*(a), a\big):$$
the effect of the parameter on the maximized value is its **direct** effect only; the change of the optimizer does not contribute to first order. For constrained problems $\max\{f(x, a) : g(x, a) = 0\}$ the same holds with the Lagrangian in place of $f$: $V'(a) = \partial \mathcal L/\partial a$ at the optimum. Even without differentiability of $x^*$, $V$ is the upper envelope of the curves $a \mapsto f(x, a)$, each of which touches it where $x$ is optimal.`,
      idea: String.raw`By the chain rule (Rudin 9.15), $V'(a) = f_x(x^*, a)\,x^{*\prime}(a) + f_a(x^*, a)$, and the first term vanishes because $f_x(x^*, a) = 0$ at an interior maximum (Fermat, Rudin 5.8). Geometrically: for each fixed $x$, $a \mapsto f(x, a)$ lies below $V$ and touches it at the parameter where $x$ is the best choice, so at that point the two curves are tangent. When the maximizer jumps between two separated peaks, $V$ still is the upper envelope but acquires a kink, and the formula gives the two one-sided slopes.`,
      caption: String.raw`Left: the objective $f(x, a)$ as a function of the choice $x$ for the current parameter $a$ (bold blue), with neighbours faint and the maximum in green; the dashed green line tracks the maxima as $a$ moves. Right: the value $V(a)$ (black) is the upper envelope of the faint purple curves $a \mapsto f(x, a)$, one for each fixed $x$. **Drag the point on $V$**: the curve for $x = x^*(a)$ (orange) touches $V$ there, so its slope, $\partial f/\partial a$, is $V'(a)$, although $x^*$ itself moves. Choose **two peaks** and cross $a = 0$: the optimizer jumps, $V$ kinks, and the slopes from the left and right differ.`,
      deps: ['pma-5.8', 'pma-9.15'], refs: ['Varian Ch. 22'], tags: ['optimization'],
      see: ['micro-5.13'],
      credit: 'Jacob Viner, 1931 (cost curves); Paul Samuelson, 1947',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Envelope_theorem' },
      viz(v) {
        const FAM = {
          one: { label: 'one peak', f: (x, a) => a * x - (x * x) / 2 - (a * a) / 4, fa: (x, a) => x - a / 2, X: [0, 3], A: [0, 3], Y: [-1, 2.4], a0: 1.2 },
          two: { label: 'two peaks', f: (x, a) => -(x ** 4) / 4 + x * x + a * x, fa: (x) => x, X: [-2.4, 2.4], A: [-1.5, 1.5], Y: [-1.5, 3.6], a0: -0.5 },
        };
        const fam = v.select('objective', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'one', { onChange: () => { const o = FAM[fam.value]; P.set(o.a0, 0); } });
        const sL = v.stage({ x: [0, 3], y: [-1, 2.4], height: 340, axes: 'box', gutter: true, xlabel: 'choice x', ylabel: 'f(x, a)', title: 'the objective for the current $a$' });
        const sR = v.stage({ x: [0, 3], y: [-1, 2.4], height: 340, axes: 'box', gutter: true, xlabel: 'parameter a', ylabel: 'value', title: 'the value function $V(a)$ is the upper envelope' });
        v.legend([['accent', 'f(·, a) for the current a'], ['green', 'maximum and its locus'], ['purple', 'a ↦ f(x, a) for fixed x'], ['ink', 'V(a)'], ['orange', 'the curve of x = x*(a), tangent to V']]);
        const xstar = (o, a) => argmax((x) => o.f(x, a), o.X[0], o.X[1], 240, 80).x;
        const V = (o, a) => { const x = xstar(o, a); return o.f(x, a); };
        const P = sR.handle(1.2, 0, { color: 'gold', r: 7, constrain: (x) => { const o = FAM[fam.value], a = clamp(x, o.A[0] + 0.02, o.A[1] - 0.02); return [a, V(o, a)]; } });
        const cache = {};
        let st = {};
        v.render(() => {
          const k = fam.value, o = FAM[k], a = clamp(P.x, o.A[0] + 0.02, o.A[1] - 0.02), xs = xstar(o, a), Va = o.f(xs, a);
          P.set(a, Va);
          sL.setView(o.X, o.Y); sR.setView(o.A, o.Y);
          const C = cache[k] || (cache[k] = (() => { const loc = [], env = []; for (let i = 0; i <= 160; i++) { const b = o.A[0] + ((o.A[1] - o.A[0]) * i) / 160, x = xstar(o, b); loc.push([x, o.f(x, b)]); env.push([b, o.f(x, b)]); } return { loc, env }; })());
          // left
          for (let i = 0; i <= 6; i++) { const b = o.A[0] + ((o.A[1] - o.A[0]) * i) / 6; sL.fn((x) => o.f(x, b), { color: v.color('muted', 0.35), width: 1 }); }
          sL.clip(() => sL.path(k === 'one' ? C.loc : C.loc.map((q, i) => (i > 0 && Math.abs(q[0] - C.loc[i - 1][0]) > 0.5 ? null : q)), { color: 'green', width: 1.6, dash: [5, 4] }));
          sL.fn((x) => o.f(x, a), { color: 'accent', width: 2.8 });
          sL.line(xs, o.Y[0], xs, Va, GUIDE);
          sL.dot(xs, Va, { r: 6.5, color: 'green' }); plateText(sL, `x* = ${v.fix(xs, 3)}`, xs, Va, { dy: -18, color: 'green', align: 'center' });
          // right: g_x(a) = f(x, a) for a grid of x
          const nx = 14;
          for (let i = 0; i <= nx; i++) { const x = o.X[0] + ((o.X[1] - o.X[0]) * i) / nx; sR.fn((b) => o.f(x, b), { color: v.color('purple', 0.35), width: 1.1 }); }
          sR.fn((b) => o.f(xs, b), { color: 'orange', width: 2.4 });
          sR.clip(() => sR.path(C.env, { color: 'ink', width: 3 }));
          const fa = o.fa(xs, a);
          slopeLine(sR, a, Va, fa, 60, { color: 'orange', width: 1.4, dash: [4, 3] });
          // numerical checks
          const h = 1e-4, Vp = (V(o, a + h) - V(o, a - h)) / (2 * h), Vr = (V(o, a + h) - Va) / h, Vl = (Va - V(o, a - h)) / h;
          const dxs = (xstar(o, a + 1e-3) - xstar(o, a - 1e-3)) / 2e-3, fxv = (o.f(xs + 1e-5, a) - o.f(xs - 1e-5, a)) / 2e-5;
          st = { k, a, xs, Va, fa, Vp, Vr, Vl, dxs, fxv };
        });
        v.readout(() => {
          const { k, a, xs, fa, Vp, Vr, Vl, dxs, fxv } = st, f4 = (q) => fx(q, 4);
          if (Math.abs(Vr - Vl) > 1e-2) return `At $a = ${fx(a, 3)}$ the best choice **jumps** between the two peaks: $V$ has a kink, with slope ${f4(Vl)} from the left and ${f4(Vr)} from the right. Each one-sided slope is $\\partial f/\\partial a = x$ at the corresponding peak; there is no single derivative, because the optimizer is not differentiable (not even continuous) here.`;
          return `At $a = ${fx(a, 3)}$: $x^* = ${f4(xs)}$, $V'(a) = ${f4(Vp)}$ (re-optimizing at $a \\pm h$) and $\\partial f/\\partial a(x^*, a) = ${f4(fa)}$. The optimizer moves, $dx^*/da = ${f4(dxs)}$, but $\\partial f/\\partial x(x^*, a) = ${v.sci(Math.abs(fxv) < 1e-9 ? 0 : fxv, 2)}$, so the indirect effect $f_x\\,dx^*/da$ vanishes.${k === 'two' ? ' Move across $a = 0$ to see the optimizer jump.' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.10
    {
      num: '7.10', kind: 'Theorem', name: 'Shephard’s lemma',
      statement: String.raw`If the cost function $c(w, r, y)$ is differentiable in the input prices at $(w, r)$ (as it is when the conditional factor demands are unique), then the conditional factor demands are its price derivatives:
$$\frac{\partial c}{\partial w}(w, r, y) = L(w, r, y), \qquad \frac{\partial c}{\partial r}(w, r, y) = K(w, r, y).$$
Moreover $c$ is concave in $(w, r)$, so conditional demand for an input never rises with its own price: $\partial L/\partial w = \partial^2 c/\partial w^2 \le 0$. Where demands are not unique (perfect substitutes at equal cost per unit of output) $c$ has a kink, and its one-sided derivatives are the extreme demands.`,
      idea: String.raw`This is the envelope theorem (7.9) applied to $c(w, r, y) = \min\{wL + rK : f(L, K) \ge y\}$: the objective $wL + rK$ has derivative $L$ in $w$, and re-optimizing the bundle has no first-order effect. Geometrically, each fixed bundle $(L_0, K_0)$ costs $wL_0 + rK_0$, a straight line in $w$ with slope $L_0$; the cost function is the **lower envelope** of these lines, hence concave, and it touches the line of the optimal bundle with the same slope. The consumer's version, $\partial e/\partial p_i = h_i$, is the same argument (micro-5.12).`,
      caption: String.raw`Left: the isoquant for $y = 4$ and the cheapest isocost line at the current wage ($r = 6$). Right: the cost function $c(w)$ (black), together with faint straight lines $w \mapsto wL_0 + rK_0$, one for each bundle that is optimal at some wage; $c$ is their lower envelope. **Nudge the wage**: the orange line, the cost of the currently optimal bundle, is tangent to $c$, and the bars compare its slope measured numerically with the labour demand $L$. Try every technology; with **linear** isoquants $c$ has a kink at $w = 6$, where the demand jumps and the derivative does not exist.`,
      deps: ['micro-7.8', 'micro-7.9'], refs: ['Varian Ch. 21'], tags: ['costs', 'duality'],
      see: ['micro-5.12', 'micro-5.13'],
      credit: 'Ronald Shephard, 1953 (anticipated by Harold Hotelling, 1932, and John Hicks, 1939)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shephard%27s_lemma' },
      viz(v) {
        const r = 6, y = 4;
        const FAM = {
          cd: { label: 'Cobb–Douglas', T: tech('cd', { a: 0.5, b: 0.5 }) },
          c03: { label: 'CES, $\\sigma = 0.3$', T: tech('ces', { al: 0.5, s: 0.3 }) },
          c3: { label: 'CES, $\\sigma = 3$', T: tech('ces', { al: 0.5, s: 3 }) },
          leon: { label: 'Leontief', T: tech('leon', { a: 1, b: 1 }) },
          lin: { label: 'linear', T: tech('lin', { a: 0.5, b: 0.5 }) },
        };
        const fam = v.select('technology', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd', { onChange: () => { if (fam.value === 'lin') wS.set(6); } });
        const wS = v.slider('wage $w$', 1, 20, 9, { step: 0.05 });
        v.button('w − 0.5', () => wS.set(Math.max(1, wS.value - 0.5)));
        v.button('w + 0.5', () => wS.set(Math.min(20, wS.value + 0.5)));
        const s = v.stage({ x: [0, 14], y: [0, 14], height: 340, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'capital K', title: 'isoquant $y = 4$ and the cheapest isocost', weight: 0.95 });
        const g = v.stage({ x: [0, 20], y: [0, 100], height: 340, axes: 'box', gutter: true, xlabel: 'wage w', ylabel: 'cost', title: 'cost function $c(w)$: lower envelope of lines', weight: 1.15 });
        const b = v.stage({ x: [0, 3], y: [0, 10], height: 340, axes: 'box', gutter: true, ylabel: 'units of labour', xticks: [[1, '∂c/∂w'], [2, 'L*(w)']], title: 'slope vs demand', weight: 0.45, minWidth: 180 });
        v.legend([['purple', 'isoquant'], ['accent', 'cheapest isocost'], ['ink', 'cost function c(w)'], ['purple', 'cost of a fixed bundle, wL₀ + rK₀', { dash: true }], ['orange', 'cost of the current optimal bundle (tangent)']]);
        let st = {};
        v.render(() => {
          const T = FAM[fam.value].T, w = wS.value, o = T.cmin(w, r, y);
          // input space
          drawIsoq(s, T, y, { color: 'purple', width: 2.6 });
          isocost(s, w, r, o.c, { fill: true });
          s.dot(o.x[0], o.x[1], { r: 7, color: 'green' });
          s.text(`L* = ${v.fix(o.x[0], 2)}`, o.x[0], o.x[1], { dx: 12, dy: -12, ...LBL, color: 'green', align: 'left', plate: true });
          // cost function and the lines of fixed bundles
          const cmax = Math.ceil((T.cmin(20, r, y).c * 1.15) / 10) * 10;
          g.setView([0, 20], [0, cmax]);
          for (let i = 0; i <= 12; i++) { const wi = 1 + (19 * i) / 12, q = T.cmin(wi, r, y).x; g.clip(() => g.line(0, r * q[1], 20, 20 * q[0] + r * q[1], { color: 'purple', width: 1, alpha: 0.4, dash: [4, 4] })); }
          g.fn((q) => T.cmin(q, r, y).c, { domain: [0.3, 20], color: 'ink', width: 3, n: 240 });
          g.clip(() => g.line(0, r * o.x[1], 20, 20 * o.x[0] + r * o.x[1], { color: 'orange', width: 2.2 }));
          // slope triangle on the tangent
          const dw = 2, w1 = Math.min(w + dw, 19.8);
          g.line(w, o.c, w1, o.c, { color: 'orange', width: 1.2 }); g.line(w1, o.c, w1, o.c + (w1 - w) * o.x[0], { color: 'orange', width: 1.2 });
          g.text(`slope ${v.fix(o.x[0], 2)}`, w1, o.c + ((w1 - w) * o.x[0]) / 2, { dx: 6, size: 11, color: 'orange', align: 'left', plate: true });
          g.dot(w, o.c, { r: 6.5, color: 'green' });
          // numerical derivative of c (re-solving) vs demand
          const h = 1e-4, cp = T.cmin(w + h, r, y).c, cm = T.cmin(w - h, r, y).c, dR = (cp - o.c) / h, dL = (o.c - cm) / h, dC = (cp - cm) / (2 * h);
          const c2 = (T.cmin(w + 0.05, r, y).c - 2 * o.c + T.cmin(w - 0.05, r, y).c) / 0.0025;
          const bmax = Math.max(2, Math.ceil(Math.max(o.x[0], dC, dR, dL) * 1.25));
          b.setView([0, 3], [0, bmax]);
          const kink = Math.abs(dR - dL) > 1e-3;
          if (kink) { bar(b, 0.82, 0.3, 0, dL, 'orange', { fillAlpha: 0.45 }); bar(b, 1.18, 0.3, 0, dR, 'orange', { fillAlpha: 0.85 }); b.text('left / right', 1, Math.max(dL, dR), { dy: -9, size: 10.5, color: 'orange', align: 'center' }); }
          else { bar(b, 1, 0.6, 0, dC, 'orange'); b.text(v.fix(dC, 3), 1, dC, { dy: -9, size: 11, color: 'ink', align: 'center', weight: 700 }); }
          bar(b, 2, 0.6, 0, o.x[0], 'green'); b.text(v.fix(o.x[0], 3), 2, o.x[0], { dy: -9, size: 11, color: 'ink', align: 'center', weight: 700 });
          st = { w, o, dC, dR, dL, kink, c2, k: fam.value };
        });
        v.readout(() => {
          const { w, o, dC, dR, dL, kink, c2, k } = st, f4 = (q) => v.fix(q, 4);
          if (kink) return `At $w = ${v.fix(w, 2)}$ the cost function has a **kink**: its slope is ${f4(dL)} from the left and ${f4(dR)} from the right. Labour and capital cost the same per unit of output, every mix on the isoquant is optimal, and conditional demand is not unique, so Shephard's lemma applies only on each side (the one-sided slopes are the extreme demands).`;
          const note = k === 'leon' ? ' Leontief: the bundle never changes, so every line is the same line and $c$ is linear in $w$.' : '';
          return `At $w = ${v.fix(w, 2)}$, $r = ${r}$, $y = ${y}$: cost $c = ${v.fix(o.c, 3)}$, numerical slope $\\partial c/\\partial w = ${f4(dC)}$, conditional labour demand $L^* = ${f4(o.x[0])}$ (difference ${Math.abs(dC - o.x[0]) < 1e-12 ? '$< 10^{-12}$' : `$${v.sci(Math.abs(dC - o.x[0]), 1)}$`}). Curvature $\\partial^2 c/\\partial w^2 \\approx ${fx(c2, 4)} \\le 0$: ${Math.abs(c2) < 1e-6 ? '$c$ is linear here, so labour demand does not respond to the wage' : '$c$ is concave, so labour demand falls as the wage rises'}.${note}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.11
    {
      num: '7.11', kind: 'Definition', name: 'Fixed, variable, average and marginal cost',
      statement: String.raw`In the short run total cost splits as $TC(y) = F + VC(y)$, where the **fixed cost** $F$ (here $r\bar K$) does not vary with output and must be paid even at $y = 0$, and the **variable cost** $VC(y)$, with $VC(0) = 0$, is the cost of the variable inputs. Per unit of output:
$$AC = \frac{TC}{y}, \qquad AVC = \frac{VC}{y}, \qquad AFC = \frac{F}{y}, \qquad AC = AVC + AFC,$$
and **marginal cost** is $MC(y) = TC'(y) = VC'(y)$, the cost of one more unit (fixed cost drops out). On the graph of $TC$, $AC(y)$ is the slope of the ray from the origin to the point, $AVC(y)$ the slope of the ray from the fixed-cost intercept $(0, F)$, and $MC(y)$ the slope of the tangent.`,
      idea: String.raw`All the per-unit curves are read off one total-cost curve, which itself comes from the technology: with capital fixed, producing $y$ needs the labour $L$ solving $f(L, \bar K) = y$, so $VC(y) = wL$. Average fixed cost is a hyperbola that keeps falling, so $AC$ and $AVC$ approach each other as output grows. The S-shape of $TC$ (convex after an initial concave stretch) is the mirror image of the S-shaped total product curve of 7.1: increasing marginal returns make cost rise slowly at first, diminishing returns (7.2) make it climb steeply later.`,
      caption: String.raw`**Drag the gold point along the total cost curve** (top). Three slopes are drawn through it: the blue ray from the origin ($AC$), the teal ray from the fixed-cost intercept ($AVC$) and the orange tangent ($MC$); the dashed curve is variable cost, $TC - F$. Below, the same three numbers are traced against output along with $AFC$. The plant size $\bar K$ sets the fixed cost $r\bar K$; the wage scales the variable cost. The cost curves are computed from the production function, not drawn by hand.`,
      deps: ['micro-7.8', 'micro-7.6'], refs: ['Mankiw Ch. 13', 'Varian Ch. 22'], tags: ['costs'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cost_curve' },
      viz(v) {
        const T = UTECH();
        const KS = v.slider('plant size $\\bar K$ (fixed cost $10\\bar K$)', 2, 12, 6, { step: 0.1 });
        const wS = v.slider('wage $w$', 5, 20, 10, { step: 0.1 });
        const Y = 11;
        const t = v.stage({ x: [0, Y], y: [0, 400], height: 330, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'cost', title: 'total cost: three slopes through one point', full: true });
        const a = v.stage({ x: [0, Y], y: [0, 70], height: 290, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'cost per unit', title: 'average and marginal cost', full: true });
        v.legend([['ink', 'TC'], ['teal', 'VC = TC − F', { dash: true }], ['accent', 'AC: ray from the origin'], ['teal', 'AVC: ray from (0, F)'], ['orange', 'MC: tangent'], ['muted', 'AFC', { dash: true }]]);
        const H = t.handle(7, 0, { color: 'gold', r: 7, constrain: (x) => { const q = clamp(x, 0.4, Y - 0.2); return [q, costCurves(T, wS.value, 10, KS.value).TC(q)]; } });
        let st = {};
        v.render(() => {
          const C = costCurves(T, wS.value, 10, KS.value), q = H.x, tc = C.TC(q);
          H.set(q, tc);
          const tmax = Math.ceil((C.TC(Y) * 1.08) / 50) * 50;
          t.setView([0, Y], [0, tmax]);
          t.hline(C.FC, { color: 'muted', width: 1, dash: [4, 4] });
          t.text(`F = r·K̄ = ${v.fix(C.FC, 0)}`, Y - 0.1, C.FC, { dy: 12, size: 11, color: 'muted', align: 'right' });
          t.fn(C.VC, { domain: [0, Y], color: 'teal', width: 1.6, dash: [6, 4], alpha: 0.8 });
          t.fn(C.TC, { domain: [0, Y], color: 'ink', width: 2.8 });
          t.clip(() => t.line(0, 0, Y, (tc / q) * Y, { color: 'accent', width: 2 }));
          t.clip(() => t.line(0, C.FC, Y, C.FC + ((tc - C.FC) / q) * Y, { color: 'teal', width: 2 }));
          slopeLine(t, q, tc, C.MC(q), 90, { color: 'orange', width: 2.6 });
          t.dot(0, C.FC, { r: 4.5, color: 'teal' });
          t.line(q, 0, q, tc, GUIDE);
          // per-unit curves
          a.setView([0, Y], [0, 70]);
          a.fn(C.AFC, { domain: [0.3, Y], color: 'muted', width: 1.6, dash: [5, 4] });
          a.fn(C.AVC, { domain: [0.05, Y], color: 'teal', width: 2.6 });
          a.fn(C.AC, { domain: [0.3, Y], color: 'accent', width: 2.6 });
          a.fn(C.MC, { domain: [0.05, Y], color: 'orange', width: 2.6 });
          a.line(q, 0, q, 70, GUIDE);
          const vals = [[C.AC(q), 'accent', 'AC'], [C.AVC(q), 'teal', 'AVC'], [C.MC(q), 'orange', 'MC'], [C.AFC(q), 'muted', 'AFC']];
          vals.forEach(([val, col]) => { if (val < 70) a.dot(q, val, { r: 5, color: col }); });
          const lab = (f, txt, col, x) => { const yv = f(x); if (yv < 66) a.text(txt, x, yv, { dx: 6, dy: -8, size: 11.5, weight: 700, color: col, align: 'left' }); };
          lab(C.AC, 'AC', 'accent', 10.3); lab(C.AVC, 'AVC', 'teal', 10.3); lab(C.AFC, 'AFC', 'muted', 10.3);
          const xm = argmin((x) => Math.abs(C.MC(x) - 64), 2, Y, 120).x; if (C.MC(xm) < 70) a.text('MC', xm, C.MC(xm), { dx: -8, size: 11.5, weight: 700, color: 'orange', align: 'right' });
          st = { C, q, tc };
        });
        v.readout(() => {
          const { C, q, tc } = st, f2 = (x) => v.fix(x, 2);
          return `At $y = ${f2(q)}$: $TC = ${f2(tc)} = F + VC = ${f2(C.FC)} + ${f2(tc - C.FC)}$. $AC = ${f2(C.AC(q))} = AVC + AFC = ${f2(C.AVC(q))} + ${f2(C.AFC(q))}$; $MC = ${f2(C.MC(q))}$ (slope of $TC$, the same as the slope of $VC$). The variable cost is the wage times the labour that the technology needs: $L = ${f2(C.VC(q) / wS.value)}$ workers with $\\bar K = ${v.fix(KS.value, 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.12
    {
      num: '7.12', kind: 'Proposition', name: 'Marginal cost cuts average cost at its minimum',
      statement: String.raw`Let $TC$ be differentiable on $(0, \infty)$ and $AC(y) = TC(y)/y$. Then
$$AC'(y) = \frac{MC(y) - AC(y)}{y},$$
so average cost falls where $MC < AC$, rises where $MC > AC$, and at any interior minimum of average cost $MC = AC$: the marginal cost curve passes through the bottom of the average cost curve. The same holds for average variable cost, $AVC'(y) = (MC(y) - AVC(y))/y$, so $MC$ also passes through the minimum of $AVC$, which lies to the left of the minimum of $AC$.`,
      idea: String.raw`The identity is the quotient rule: $(TC/y)' = (y\,TC' - TC)/y^2$. Then the interior extremum condition (Fermat, Rudin 5.8) gives $MC = AC$, and the sign of $AC'$ (via the mean value theorem, Rudin 5.3 and 5.11) tells where $AC$ is decreasing or increasing. The intuition is the averaging of grades: a new score above your average pulls it up, one below pulls it down. Because $AC = AVC + F/y$ exceeds $AVC$ by a falling amount, the crossing with $MC$ happens later on $AC$ than on $AVC$.`,
      caption: String.raw`**Drag the output marker** along the axis. The vertical bar between $MC$ and $AC$ is green when marginal cost is below average cost (pulling it down) and red when above (pushing it up); the arrow on $AC$ shows which way it is heading. Rings mark the minima of $AC$ and $AVC$, found by numerical minimization, and $MC$ passes through both. The lower panel plots the two sides of the identity, the slope $AC'(y)$ and $(MC - AC)/y$, computed independently: the curves coincide and cross zero at the minimum. Change the plant size or the wage and the property persists.`,
      deps: ['micro-7.11', 'pma-5.3', 'pma-5.8'], refs: ['Varian Ch. 22', 'Mankiw Ch. 13'], tags: ['costs'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginal_cost' },
      viz(v) {
        const T = UTECH();
        const KS = v.slider('plant size $\\bar K$', 2, 12, 6, { step: 0.1 });
        const wS = v.slider('wage $w$', 5, 20, 10, { step: 0.1 });
        const Y = 11;
        const s = v.stage({ x: [0, Y], y: [0, 60], height: 360, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'cost per unit', title: 'average costs and marginal cost', full: true });
        const d = v.stage({ x: [0, Y], y: [-6, 6], height: 200, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'per unit²', title: 'two sides of the identity: $AC\'(y)$ and $(MC - AC)/y$', full: true });
        v.legend([['accent', 'AC'], ['teal', 'AVC'], ['orange', 'MC'], ['green', 'MC < AC: average falls'], ['red', 'MC > AC: average rises'], ['purple', "AC′(y), numerical"], ['gold', '(MC − AC)/y', { dash: true }]]);
        const H = s.handle(3.5, 0, { color: 'gold', r: 7, label: 'y', constrain: (x) => [clamp(x, 0.6, Y - 0.2), 0] });
        let st = {};
        v.render(() => {
          const C = costCurves(T, wS.value, 10, KS.value), q = H.x;
          const mAC = C.minAC(Y + 4), mAVC = C.minAVC(Y + 4);
          const top = Math.max(40, Math.ceil((mAC.f * 2.4) / 10) * 10);
          s.setView([0, Y], [0, top]);
          s.fn(C.AVC, { domain: [0.05, Y], color: 'teal', width: 2.4 });
          s.fn(C.AC, { domain: [0.2, Y], color: 'accent', width: 2.8 });
          s.fn(C.MC, { domain: [0.05, Y], color: 'orange', width: 2.8 });
          // bar between MC and AC
          const ac = C.AC(q), mc = C.MC(q), down = mc < ac;
          s.line(q, Math.min(ac, top), q, Math.min(mc, top), { color: down ? 'green' : 'red', width: 5, alpha: 0.75 });
          // direction arrow along AC
          const dq = 0.55 * (Y / 11), q2 = q + dq, s0 = [s.X(q), s.Y(ac)], s1 = [s.X(q2), s.Y(C.AC(q2))], L = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]), k = 34 / L;
          const e = s.inv(s0[0] + (s1[0] - s0[0]) * k, s0[1] + (s1[1] - s0[1]) * k);
          if (ac < top) s.arrow(q, ac, e[0], e[1], { color: down ? 'green' : 'red', width: 2.4, head: 9 });
          s.dot(q, Math.min(ac, top), { r: 5.5, color: 'accent' }); if (mc < top) s.dot(q, mc, { r: 5.5, color: 'orange' });
          s.dot(mAC.x, mAC.f, { r: 6, color: 'accent', hollow: true }); s.dot(mAVC.x, mAVC.f, { r: 6, color: 'teal', hollow: true });
          plateText(s, `min AC at y = ${v.fix(mAC.x, 2)}`, mAC.x, mAC.f, { dy: 22, color: 'accent', align: 'center' });
          plateText(s, `min AVC at y = ${v.fix(mAVC.x, 2)}`, mAVC.x, mAVC.f, { dy: 22, color: 'teal', align: 'center' });
          const lab = (f, txt, col, x) => { const yv = f(x); if (yv < top * 0.95) s.text(txt, x, yv, { dx: 6, dy: -8, size: 11.5, weight: 700, color: col, align: 'left' }); };
          lab(C.AC, 'AC', 'accent', 10.2); lab(C.AVC, 'AVC', 'teal', 10.2);
          // the identity
          const dAC = (x) => dif(C.AC, x, 1e-4), rhs = (x) => (C.MC(x) - C.AC(x)) / x;
          const lim = Math.max(1, Math.ceil(Math.max(Math.abs(dAC(Math.max(1, mAC.x * 0.45))), Math.abs(dAC(Y))) * 1.15));
          d.setView([0, Y], [-lim, lim]);
          d.hline(0, { color: 'muted', width: 1 });
          d.fn(dAC, { domain: [0.6, Y], color: 'purple', width: 4, alpha: 0.6 });
          d.fn(rhs, { domain: [0.6, Y], color: 'gold', width: 2, dash: [6, 4] });
          d.vline(mAC.x, { color: 'accent', width: 1, dash: [3, 3] });
          d.dot(q, dAC(q), { r: 5, color: 'purple' });
          st = { C, q, ac, mc, mAC, mAVC, l: dAC(q), r: rhs(q) };
        });
        v.readout(() => {
          const { C, q, ac, mc, mAC, mAVC, l, r } = st, f3 = (x) => v.fix(x, 3);
          return `At $y = ${v.fix(q, 2)}$: $MC = ${f3(mc)}$ ${mc < ac ? '<' : '>'} $AC = ${f3(ac)}$, so average cost is **${mc < ac ? 'falling' : 'rising'}**; $AC'(y) = ${fx(l, 4)}$ and $(MC - AC)/y = ${fx(r, 4)}$. Minimum of $AC$ (by search): $y = ${f3(mAC.x)}$, $AC = ${f3(mAC.f)}$, where $MC = ${f3(C.MC(mAC.x))}$. Minimum of $AVC$: $y = ${f3(mAVC.x)}$, $AVC = ${f3(mAVC.f)}$, $MC = ${f3(C.MC(mAVC.x))}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.13
    {
      num: '7.13', kind: 'Principle', name: 'Sunk costs are irrelevant',
      statement: String.raw`A **sunk cost** is one already incurred that cannot be recovered whatever is decided now. Because it is the same under every available option, it cancels from every comparison: a rational decision to continue or abandon a project compares only **future** revenues with **future** costs, and is unchanged by the size of the sunk outlay. In the short run, fixed costs that are sunk play no role in the decision how much to produce or whether to shut down (micro-8.3). Letting a sunk cost sway a choice, by persisting in order to "recover" it or because one has "come too far to quit", is the **sunk-cost fallacy**.`,
      scope: String.raw`Holds for a decision-maker who cares about outcomes, not about the history that led to them. Costs that are only *partly* sunk (equipment with a resale value) count to the extent they can be recovered; reputational or informational effects of quitting are future consequences and may legitimately count. Experiments and field data (Arkes and Blumer 1985; Staw 1976) show that people often violate the principle.`,
      idea: String.raw`Write the payoff of continuing as $-S + R - C$ and of abandoning as $-S$, where $S$ is sunk, $R$ the future revenue and $C$ the remaining cost. The difference is $R - C$, independent of $S$: whatever $S$ is, continue exactly when $R > C$ (opportunity cost, micro-1.2). Any rule whose boundary moves with $S$ must therefore get some projects wrong, abandoning some whose future value is positive or finishing some whose future value is negative.`,
      caption: String.raw`Each dot is a project with a remaining cost $C$ (horizontal) and future revenue $R$ (vertical); the sunk sum $S$ is the same for all. Above the black diagonal $R = C$ finishing pays. Pick a **rule**: the rational rule ignores $S$; "recover what we spent" finishes only if $R \ge S + C$ (its boundary, dashed red, moves up with $S$); "too far to quit" finishes if $R + S \ge C$ (boundary moves down). Wrong decisions are ringed in red and their losses tallied. **Drag the gold project**: the bars compare continuing with abandoning, with and without the sunk sum, and the difference never depends on $S$.`,
      deps: ['micro-1.2', 'micro-7.11'], refs: ['Mankiw Ch. 14', 'Varian Ch. 21'], tags: ['costs', 'decisions'],
      credit: 'Concept standard in 19th-century cost accounting; fallacy documented by Hal Arkes and Catherine Blumer, 1985',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sunk_cost' },
      viz(v) {
        const R0 = v.rng(17), N = 260, projects = [];
        for (let i = 0; i < N; i++) projects.push([R0.uniform(2, 98), R0.uniform(2, 98)]);
        const rule = v.select('decision rule', [{ value: 'ok', label: 'rational: finish iff R > C' }, { value: 'rec', label: 'recover what we spent: R ≥ S + C' }, { value: 'far', label: 'too far to quit: R + S ≥ C' }], 'rec');
        const S = v.slider('sunk sum $S$ (already spent)', 0, 60, 25, { step: 1 });
        const s = v.stage({ x: [0, 100], y: [0, 100], height: 380, axes: 'box', gutter: true, xlabel: 'remaining cost C', ylabel: 'future revenue R', title: 'finish or abandon? 260 projects', weight: 1.25 });
        const b = v.stage({ x: [0, 5], y: [-80, 80], height: 380, axes: 'box', gutter: true, ylabel: 'payoff', xticks: [[1, 'finish'], [2, 'abandon'], [3.4, 'finish'], [4.4, 'abandon']], title: 'the gold project: future only | including S', weight: 0.85 });
        v.legend([['green', 'finished'], ['muted', 'abandoned'], ['red', 'wrong decision (ringed)'], ['ink', 'rational boundary R = C'], ['red', "the rule's boundary", { dash: true }]]);
        const G = s.handle(38, 54, { color: 'gold', r: 8, constrain: (x, y) => [clamp(x, 1, 99), clamp(y, 1, 99)] });
        const decide = (k, R, C, Sv) => (k === 'ok' ? R > C : k === 'rec' ? R >= Sv + C : R + Sv >= C);
        let st = {};
        v.render(() => {
          const k = rule.value, Sv = S.value;
          // regions
          if (k !== 'ok') {
            const off = k === 'rec' ? Sv : -Sv;
            s.clip(() => s.poly(k === 'rec' ? [[0, 0], [100, 100], [100, 100 + off], [0, off]] : [[0, 0], [100, 100], [100, 100 + off], [0, off]], { fill: 'red', fillAlpha: 0.1, stroke: false, hatch: 'red', hatchAlpha: 0.25 }));
            s.clip(() => s.line(0, off, 100, 100 + off, { color: 'red', width: 2, dash: [7, 5] }));
          }
          s.line(0, 0, 100, 100, { color: 'ink', width: 2 });
          let wrong = 0, loss = 0, fin = 0;
          for (const [C, R] of projects) {
            const d = decide(k, R, C, Sv), right = R > C, bad = d !== right;
            if (d) fin++;
            if (bad) { wrong++; loss += Math.abs(R - C); }
            if (bad) s.circle(C, R, 1.6, { color: 'red', width: 1.8 });
            s.dot(C, R, { r: 3.2, color: d ? 'green' : 'muted', alpha: d ? 0.85 : 0.6 });
          }
          plateText(s, 'finishing pays (R > C)', 4, 94, { color: 'ink', align: 'left' });
          plateText(s, 'abandoning pays', 96, 6, { color: 'ink', align: 'right' });
          // gold project
          const C = G.x, R = G.y, d = decide(k, R, C, Sv);
          s.text(d ? 'finish' : 'abandon', C, R, { dx: 12, dy: -12, ...LBL, color: d === R > C ? 'gold' : 'red', align: 'left', plate: true });
          const fut = [R - C, 0], tot = [-Sv + R - C, -Sv];
          const vals = [...fut, ...tot], lim = Math.max(60, Math.ceil(Math.max(...vals.map(Math.abs)) / 20) * 20 + 10);
          b.setView([0, 5], [-lim, lim]);
          b.hline(0, { color: 'muted', width: 1 });
          const xs = [1, 2, 3.4, 4.4];
          vals.forEach((val, i) => {
            const best = i % 2 === 0 ? vals[i] >= vals[i + 1] : vals[i] > vals[i - 1];
            bar(b, xs[i], 0.7, 0, val, best ? 'green' : 'muted', { fillAlpha: best ? 0.7 : 0.4 });
            b.text(v.fix(val, 0), xs[i], val, { dy: val >= 0 ? -9 : 12, size: 11, color: 'ink', align: 'center', weight: 700 });
          });
          b.vline(2.7, { color: 'faint', width: 1 });
          b.measure(4.85, tot[1], 4.85, tot[0], null, { color: 'gold' });
          b.measure(2.45, fut[1], 2.45, fut[0], null, { color: 'gold' });
          st = { k, Sv, wrong, loss, fin, C, R, d };
        });
        v.readout(() => {
          const { k, Sv, wrong, loss, fin, C, R, d } = st, f0 = (x) => v.fix(x, 0);
          const gold = `Gold project: finishing beats abandoning by $R - C = ${f0(R - C)}$ in future terms and by $(-S + R - C) - (-S) = ${f0(R - C)}$ including the sunk sum: the same number for every $S$. The rule says **${d ? 'finish' : 'abandon'}**${d === (R > C) ? '' : ' — a mistake'}.`;
          if (k === 'ok') return `Rational rule: ${fin} of 260 projects finished, no wrong decisions, whatever the sunk sum (now ${f0(Sv)}). ${gold}`;
          const what = k === 'rec' ? 'abandons profitable projects whose revenue covers the remaining cost but not the sunk sum' : 'finishes losing projects because abandoning them would "waste" what was spent';
          return `With $S = ${f0(Sv)}$ this rule ${what}: ${wrong} wrong decisions, a total loss of ${f0(loss)} against the rational rule. Set $S = 0$ and the rule coincides with the rational one. ${gold}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.14
    {
      num: '7.14', kind: 'Proposition', name: 'Long-run average cost and economies of scale',
      statement: String.raw`For each plant size $\bar K$ let $SAC(y; \bar K) = c_s(y; \bar K)/y$ be the short-run average cost, and $LAC(y) = c(y)/y$ the long-run average cost. Then $LAC(y) = \min_{\bar K} SAC(y; \bar K)$: the long-run average cost curve is the **lower envelope** of the short-run curves. Each $SAC(\cdot; \bar K)$ touches $LAC$ at the output $y(\bar K)$ for which $\bar K$ is the cost-minimizing plant, and there both the levels and the slopes agree, and so do the marginal costs: $SMC = LMC$. The tangency lies on the falling part of $SAC$ (left of its minimum) where $LAC$ is falling, and on the rising part where $LAC$ is rising; only at the minimum of $LAC$ does it coincide with the minimum of $SAC$. Outputs where $LAC$ falls show **economies of scale**, where it rises **diseconomies of scale**; the smallest output at which $LAC$ reaches its minimum is the **minimum efficient scale**.`,
      idea: String.raw`The envelope relation is 7.6 divided by $y$: long-run cost is the minimum of short-run costs over plant sizes. At the tangency output the derivative of $SAC$ in $y$ equals that of $LAC$ by the envelope theorem (7.9), because changing $y$ while re-optimizing the plant has no first-order effect at the optimal plant. So when $LAC$ slopes down, the touching $SAC$ slopes down too, and its own minimum lies further right: a firm with economies of scale builds a plant that it runs below its cheapest rate. Jacob Viner's 1931 draughtsman famously drew the envelope through the minima, which is impossible unless $LAC$ is flat; that case, constant returns, is included here.`,
      caption: String.raw`**Slide the plant size** $\bar K$: the bold blue curve is that plant's short-run average cost, faint curves are other plants, and the black curve is the long-run average cost, their lower envelope. The green dot is where the bold curve touches the envelope; the hollow blue ring is its own minimum, which lies right of the tangency where there are economies of scale and left of it where there are diseconomies. The strip along the bottom marks economies (falling $LAC$), the minimum efficient scale and diseconomies. Below, the short-run and long-run **marginal** costs cross at the tangency output. Choose a technology with a **flat bottom** or **constant returns** to see the special cases.`,
      deps: ['micro-7.6', 'micro-7.9', 'micro-7.11'], refs: ['Varian Ch. 22', 'Mankiw Ch. 13'], tags: ['costs', 'scale'],
      credit: 'Jacob Viner, 1931, with the correction by Y. K. Wong',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Economies_of_scale' },
      viz(v) {
        const w = 10, r = 10, Y = 13;
        const FAM = { U: { label: 'U-shaped' }, flat: { label: 'flat bottom' }, crs: { label: 'constant returns' } };
        const fam = v.select('long-run returns to scale', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'U');
        const KS = v.slider('plant size $\\bar K$', 1, 16, 3.4, { step: 0.05 });
        const s = v.stage({ x: [0, Y], y: [12, 44], height: 380, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'cost per unit', title: 'short-run average costs and their envelope', full: true });
        const m = v.stage({ x: [0, Y], y: [0, 60], height: 210, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'marginal cost', title: 'short-run and long-run marginal cost', full: true });
        v.legend([['accent', 'SAC for the chosen plant'], ['faint', 'SAC for other plants'], ['ink', 'LAC: the envelope'], ['green', 'tangency'], ['orange', 'SMC'], ['purple', 'LMC']]);
        const cache = {};
        let st = {};
        v.render(() => {
          const k = fam.value, T = cache[k] || (cache[k] = UTECH({ kind: k })), S = T.S, Kb = KS.value;
          const SAC = (y, K) => (w * S.Z(y) ** 2 / K + r * K) / y, LAC = (y) => (2 * Math.sqrt(w * r) * S.Z(y)) / y;
          const SMC = (y, K) => (2 * w * S.Z(y) * S.dZ(y)) / K, LMC = (y) => 2 * Math.sqrt(w * r) * S.dZ(y);
          const yT = S.Zinv(Kb), mS = argmin((y) => SAC(y, Kb), 0.05, 40, 200, 70);
          // regions of LAC (from the scale function): falling / flat / rising
          const lacD = (y) => dif(LAC, y, 1e-4);
          const lo = 12, hi = 44; s.setView([0, Y], [lo, hi]);
          const band = (a, b, col, txt) => { if (b - a < 0.02) return; s.rect(a, lo, b, lo + 1.8, { fill: col, fillAlpha: 0.35, stroke: false }); if (s.X(b) - s.X(a) > 90) s.text(txt, (a + b) / 2, lo + 0.9, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle' }); };
          let y1 = Y, y2 = Y;
          for (let i = 1; i <= 520; i++) { const y = (Y * i) / 520; if (y1 === Y && lacD(y) > -1e-4) y1 = y; if (y1 < Y && y2 === Y && lacD(y) > 1e-4) { y2 = y; break; } }
          if (k === 'crs') { y1 = 0; y2 = Y; }
          for (let K = 1; K <= 16.01; K += 1.25) s.fn((y) => SAC(y, K), { domain: [0.1, Y], color: v.color('muted', 0.35), width: 1 });
          s.fn(LAC, { domain: [0.1, Y], color: 'ink', width: 3.2 });
          s.fn((y) => SAC(y, Kb), { domain: [0.1, Y], color: 'accent', width: 2.8 });
          band(0, y1, 'green', 'economies of scale'); band(y1, y2, 'gold', k === 'crs' ? 'constant returns' : y2 - y1 > 0.3 ? 'minimum efficient scale →' : ''); band(y2, Y, 'red', 'diseconomies of scale');
          if (k !== 'crs') { s.vline(y1, { color: 'gold', width: 1, dash: [3, 3] }); plateText(s, `MES y = ${v.fix(y1, 2)}`, y1, lo + 4, { color: 'ink', align: 'center' }); }
          s.dot(mS.x, mS.f, { r: 7.5, color: 'accent', hollow: true });
          s.dot(yT, LAC(yT), { r: 6.5, color: 'green' });
          if (Math.abs(mS.x - yT) > 0.25) { const ya = Math.min(LAC(yT), LAC(mS.x)) - 2.5; s.line(yT, ya, yT, LAC(yT), { color: 'green', width: 1, dash: [2, 3] }); s.line(mS.x, ya, mS.x, mS.f, { color: 'accent', width: 1, dash: [2, 3] }); s.arrow(yT, ya, mS.x, ya, { color: 'accent', width: 1.6, head: 7 }); }
          { const xl = clamp(mS.x + 1.2, 1, Y - 1.5); s.text(`plant K̄ = ${v.fix(Kb, 2)}`, xl, Math.min(SAC(xl, Kb), hi - 2), { dx: 10, dy: -4, ...LBL, color: 'accent', align: 'left', plate: true }); }
          // marginal costs
          m.fn(LMC, { domain: [0.05, Y], color: 'purple', width: 2.6 });
          m.fn((y) => SMC(y, Kb), { domain: [0.05, Y], color: 'orange', width: 2.6 });
          m.vline(yT, { color: 'green', width: 1, dash: [3, 3] }); m.dot(yT, LMC(yT), { r: 6, color: 'green' });
          st = { k, Kb, yT, mS, sacT: SAC(yT, Kb), lacT: LAC(yT), sl1: dif((y) => SAC(y, Kb), yT, 1e-4), sl2: lacD(yT), smc: SMC(yT, Kb), lmc: LMC(yT), y1, y2 };
        });
        v.readout(() => {
          const { k, Kb, yT, mS, sacT, lacT, sl1, sl2, smc, lmc, y1, y2 } = st, f3 = (x) => v.fix(x, 3);
          const where = Math.abs(sl2) < 1e-3 ? 'at the bottom of $LAC$, so the tangency is also the minimum of $SAC$' : sl2 < 0 ? `where $LAC$ falls (economies of scale), so the plant is run **below** its cheapest rate: $SAC$ is lowest at $y = ${f3(mS.x)}$, right of the tangency` : `where $LAC$ rises (diseconomies), so the plant is run **beyond** its cheapest rate: $SAC$ is lowest at $y = ${f3(mS.x)}$, left of the tangency`;
          return `Plant $\\bar K = ${v.fix(Kb, 2)}$ touches the envelope at $y = ${f3(yT)}$: $SAC = ${f3(sacT)}$, $LAC = ${f3(lacT)}$; slopes ${fx(sl1, 4)} and ${fx(sl2, 4)}; $SMC = ${f3(smc)}$, $LMC = ${f3(lmc)}$. The tangency is ${where}.${k === 'flat' ? ` Minimum efficient scale $y = ${f3(y1)}$; constant returns up to $y = ${f3(y2)}$.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 7.15
    {
      num: '7.15', kind: 'Proposition', name: 'Marginal cost mirrors marginal product',
      statement: String.raw`Suppose labour is the only variable input, hired at wage $w$, with capital fixed, and $y = f(L)$ is differentiable with $f' > 0$. Then variable cost is $VC(y) = w\,f^{-1}(y)$ and
$$MC(y) = \frac{w}{MP_L(L)}, \qquad AVC(y) = \frac{w}{AP_L(L)}, \qquad\text{where } y = f(L).$$
Hence marginal cost falls while the marginal product rises and rises while it falls, with the minimum of $MC$ at the output produced by the labour where $MP_L$ peaks; likewise $AVC$ is smallest exactly where $AP_L$ is largest. Diminishing marginal returns (7.2) are the reason short-run marginal cost slopes upward.`,
      idea: String.raw`By the inverse function theorem $\frac{d}{dy}f^{-1}(y) = 1/f'(L)$, so $MC = w/MP_L$: one more unit of output needs $1/MP_L$ more workers, each costing $w$. The average version is just $VC/y = wL/f(L)$. Taking reciprocals reverses every monotonicity and turns maxima into minima, so the cost curves are the product curves turned upside down and relabelled; the crossing of $MC$ and $AVC$ (7.12) is the image of the crossing of $MP_L$ and $AP_L$ (7.1).`,
      caption: String.raw`**Drag the gold point along the marginal product curve** (bottom). The top panel shows the output it produces, $y = f(L)$, on the marginal and average variable cost curves; the readout checks $MC$, measured as the slope of the cost curve, against $w/MP_L$. The green band covers the stretch where the marginal product rises, and its image in the top panel is the stretch where marginal cost falls; the orange band is the stretch of diminishing returns, where marginal cost rises. The peak of $MP_L$ is the bottom of $MC$, and the peak of $AP_L$ is the bottom of $AVC$.`,
      deps: ['micro-7.2', 'micro-7.11'], refs: ['Mankiw Ch. 13', 'Varian Ch. 22'], tags: ['costs', 'production'],
      see: ['micro-7.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginal_cost' },
      viz(v) {
        const T = tech('hom', { S: scaleFn('U', { e1: 0.22, ys: 9 }), a: 0.5 });
        const KS = v.slider('capital $\\bar K$', 3, 12, 6, { step: 0.1 });
        const wS = v.slider('wage $w$', 5, 20, 10, { step: 0.1 });
        const LM = 14;
        const c = v.stage({ x: [0, 10], y: [0, 40], height: 290, axes: 'box', gutter: true, xlabel: 'output y', ylabel: 'cost per unit', title: 'marginal cost and average variable cost, $MC = w/MP_L$, $AVC = w/AP_L$', full: true });
        const p = v.stage({ x: [0, LM], y: [0, 2.2], height: 260, axes: 'box', gutter: true, xlabel: 'labour L', ylabel: 'output per worker', title: 'marginal and average product of labour', full: true });
        v.legend([['orange', '$MC$ and $MP_L$'], ['teal', '$AVC$ and $AP_L$'], ['green', 'MP rising ↔ MC falling', { area: true }], ['orange', 'MP falling ↔ MC rising', { area: true }]]);
        const H = p.handle(5, 0, { color: 'gold', r: 7, constrain: (x) => { const L = clamp(x, 0.2, LM - 0.2); return [L, T.mp(L, KS.value)[0]]; } });
        let st = {};
        v.render(() => {
          const K = KS.value, w = wS.value, f = (L) => T.f(L, K), mp = (L) => T.mp(L, K)[0], ap = (L) => f(L) / L;
          const L = H.x; H.set(L, mp(L));
          const y = f(L), Ymax = f(LM);
          const Lp = argmax(mp, 0.02, LM, 200).x, La = argmax(ap, 0.02, LM, 200).x, yp = f(Lp), ya = f(La);
          const VC = (q) => w * T.srL(q, K), MC = (q) => dif(VC, Math.max(q, 1e-4), 1e-5 * Math.max(1, q)), AVC = (q) => VC(q) / q;
          const top = Math.ceil((w / mp(La) * 2.6) / 10) * 10;
          c.setView([0, Ymax], [0, top]);
          p.setView([0, LM], [0, Math.ceil(mp(Lp) * 12) / 10 + 0.1]);
          c.vband(0, yp, { color: 'green', alpha: 0.1 }); c.vband(yp, Ymax, { color: 'orange', alpha: 0.07 });
          p.vband(0, Lp, { color: 'green', alpha: 0.1 }); p.vband(Lp, LM, { color: 'orange', alpha: 0.07 });
          c.fn(AVC, { domain: [0.02, Ymax], color: 'teal', width: 2.6 });
          c.fn(MC, { domain: [0.02, Ymax], color: 'orange', width: 2.8 });
          p.fn(ap, { domain: [0.01, LM], color: 'teal', width: 2.6 });
          p.fn(mp, { domain: [0.01, LM], color: 'orange', width: 2.8 });
          c.dot(yp, MC(yp), { r: 6, color: 'orange', hollow: true, label: 'min MC', labelPos: 's', math: false });
          c.dot(ya, AVC(ya), { r: 6, color: 'teal', hollow: true, label: 'min AVC', labelPos: 'n', math: false });
          p.dot(Lp, mp(Lp), { r: 6, color: 'orange', hollow: true, label: 'max MP', labelPos: 'n', math: false });
          p.dot(La, ap(La), { r: 6, color: 'teal', hollow: true, label: 'max AP', labelPos: 'ne', math: false });
          c.line(y, 0, y, Math.min(top, Math.max(MC(y), AVC(y))), GUIDE); p.line(L, 0, L, Math.max(mp(L), ap(L)), GUIDE);
          if (MC(y) < top) c.dot(y, MC(y), { r: 6, color: 'gold' }); if (AVC(y) < top) c.dot(y, AVC(y), { r: 4.5, color: 'teal' });
          p.dot(L, ap(L), { r: 4.5, color: 'teal' });
          st = { K, w, L, y, mp: mp(L), ap: ap(L), mc: MC(y), avc: AVC(y), Lp, yp, La, ya };
        });
        v.readout(() => {
          const { K, w, L, y, mp, ap, mc, avc, Lp, yp } = st, f3 = (x) => v.fix(x, 3);
          return `$L = ${v.fix(L, 2)}$ workers make $y = ${f3(y)}$. $MC$ measured as the slope of $VC$: ${f3(mc)}; $w/MP_L = ${v.fix(w, 1)}/${f3(mp)} = ${f3(w / mp)}$. $AVC = ${f3(avc)}$ and $w/AP_L = ${f3(w / ap)}$. Marginal product peaks at $L = ${f3(Lp)}$, i.e. at output $y = ${f3(yp)}$, which is exactly where $MC$ bottoms out; it is ${L < Lp ? '**rising** here, so marginal cost is falling' : '**falling** here (diminishing returns), so marginal cost is rising'}.`;
        });
      },
    },
  ],
};
