// Microeconomics — Chapter 6: Income and substitution effects, revealed preference and welfare (items 6.1–6.6; 6.7–6.13 in ch06-b.js)
import { clamp, GUIDE, LBL, SUP, sgn, showStage, prefs, demand, hicks, slutsky, drawLevel, trimArrow, budget, bline, costAt, rpAnalyze, afriat, afriatSlack, afriatPlanes, plLevel, ccei, obsEditor, drawObs } from './ch06.shared.js';

const OBS_COLS = ['blue', 'orange', 'teal', 'pink', 'gold', 'ink'];
const SUPS = (i) => SUP(i + 1);
/** Convex polygon pts clipped to the half-plane a·x ≤ c (Sutherland–Hodgman). */
function clipHalf(pts, a, c) {
  const out = [], f = (q) => c - a[0] * q[0] - a[1] * q[1];
  for (let i = 0; i < pts.length; i++) { const P = pts[i], Q = pts[(i + 1) % pts.length], fp = f(P), fq = f(Q); if (fp >= 0) out.push(P); if ((fp >= 0) !== (fq >= 0)) { const t = fp / (fp - fq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); } }
  return out;
}
const triOf = (o) => { const m = o.p[0] * o.x[0] + o.p[1] * o.x[1]; return [[0, 0], [m / o.p[0], 0], [0, m / o.p[1]]]; };

export default {
  collection: 'micro',
  chapter: 6,
  title: 'Income and substitution effects, revealed preference and welfare',
  summary: String.raw`A price change does two things at once: it changes relative prices, and it changes how much the consumer can afford. The Slutsky equation separates the two effects exactly, shows that the compensated (substitution) effect can never be positive, and explains how demand can slope upward for a strongly inferior staple, the Giffen case, now documented among poor households in China. Revealed preference turns the theory around: given a finite record of prices and choices, Afriat's theorem says exactly when some utility function explains them all and constructs one. The chapter ends by measuring welfare in money. Price indices with fixed baskets overstate the cost of living because they ignore substitution; compensating and equivalent variation are vertical distances between indifference curves; consumer surplus lies between them and coincides with both when utility is quasilinear.`,
  items: [
    // ------------------------------------------------------------------ 6.1
    {
      num: '6.1', kind: 'Concept', name: 'Substitution and income effects',
      statement: String.raw`When the price of good 1 changes from $p_1$ to $p_1'$ (income $m$ and $p_2$ fixed), the move of the best bundle from $A = x(p_1, p_2, m)$ to $C = x(p_1', p_2, m)$ is split in two:
(a) the **substitution effect** $A \to B$: the change caused by the new relative price alone, with the consumer's purchasing power held constant;
(b) the **income effect** $B \to C$: the change caused by the loss (or gain) of purchasing power at the new relative price, a parallel shift of the budget line.
There are two ways to hold purchasing power constant. **Slutsky** compensation changes income by $\Delta m = x_1^A\,\Delta p_1$ so that the old bundle $A$ is just affordable again, so the budget line pivots about $A$; **Hicks** compensation gives just enough income to reach the old indifference curve. For small price changes the two agree to first order. The substitution effect always moves demand away from the good that became dearer (6.12); the income effect has the sign of $-\Delta p_1$ for a normal good and the opposite sign for an inferior good.`,
      idea: String.raw`A price rise is equivalent to two separate events. First the relative price changes while the consumer is compensated: she moves along (Hicks) or off (Slutsky) her old indifference curve to the new tangency at the steeper slope. Then the compensation is taken away, a parallel inward shift of the budget line whose effect is read off the income offer curve (5.8). Because the pivoted Slutsky line passes through $A$, the bundle $B$ chosen on it is at least as good as $A$ (revealed preference, 6.4), so Slutsky's compensation is slightly more generous than Hicks's; the difference is of second order in $\Delta p_1$. With perfect complements there is no substitution at all, and with quasilinear tastes there is no income effect on good 1.`,
      caption: String.raw`Drag the new price of good 1 (it starts at 1). On the map the old budget is dashed grey, the compensated budget dashed orange and the new budget blue; the orange arrow $A \to B$ is the substitution effect and the teal arrow $B \to C$ the income effect. Switch between **Slutsky** compensation (the line pivots about $A$) and **Hicks** compensation (the line slides along the old indifference curve); the orange bracket on the vertical axis is the compensating income. The right panel shows the same three points on the ordinary and the compensated demand curves. Try an **inferior** good, where the teal arrow turns back.`,
      deps: ['micro-5.8', 'micro-5.9'], refs: ['Varian Ch. 8', 'Mankiw Ch. 21'], tags: ['demand', 'decomposition'],
      see: ['micro-5.10', 'micro-6.2'],
      credit: 'Eugen Slutsky, 1915; John Hicks and Roy Allen, 1934',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Substitution_effect' },
      viz(v) {
        const p2 = 1, P0 = 1, M = 10;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }) },
          ces: { label: 'CES, $\\sigma = 2$', F: prefs('ces', { a: 0.5, r: 0.5 }) },
          comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 1 }) },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 3 }) },
          inf: { label: 'inferior good 1', F: prefs('inf', { A: 12, k: 8 }) },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const cmp = v.select('compensation', [{ value: 'slutsky', label: 'Slutsky: old bundle affordable' }, { value: 'hicks', label: 'Hicks: old utility' }], 'slutsky');
        const p1 = v.slider("new price $p_1'$", 0.45, 2.5, 1.7, { step: 0.01 });
        const s = v.stage({ x: [0, 13], y: [0, 13], height: 380, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15, title: 'the indifference map ($m = 10$, $p_2 = 1$)' });
        const d = v.stage({ x: [0, 13], y: [0, 2.8], height: 380, axes: 'box', xlabel: 'x₁', ylabel: 'price p₁', title: 'ordinary and compensated demand' });
        v.legend([['muted', 'old budget line', { dash: true }], ['orange', 'compensated budget line', { dash: true }], ['accent', 'new budget line'], ['orange', 'substitution effect A → B'], ['teal', 'income effect B → C'], ['purple', 'indifference curves']]);
        const solve = (F, k, P) => {
          const A = demand(F, P0, p2, M), uA = F.u(...A), C = demand(F, P, p2, M);
          let B, mc;
          if (k === 'slutsky') { mc = M + A[0] * (P - P0); B = demand(F, P, p2, mc); }
          else { const H = hicks(F, P, p2, uA); B = H.x; mc = H.e; }
          return { A, uA, B, C, mc };
        };
        const cache = {};
        const curves = (key, F, k, A, uA) => cache[key] || (cache[key] = (() => {
          const mar = [], cmpc = [];
          for (let i = 0; i <= 90; i++) { const q = 0.3 + (2.5 * i) / 90; mar.push([demand(F, q, p2, M)[0], q]); cmpc.push([k === 'slutsky' ? demand(F, q, p2, M + A[0] * (q - P0))[0] : hicks(F, q, p2, uA).x[0], q]); }
          return { mar, cmpc };
        })());
        let st = {};
        v.render(() => {
          const kf = fam.value, F = FAM[kf].F, k = cmp.value, P = p1.value, r = solve(F, k, P), { A, uA, B, C, mc } = r;
          // budget lines
          bline(s, P0, p2, M, { color: 'muted', width: 1.8, dash: [7, 5] });
          s.clip(() => s.line(mc / P, 0, 0, mc / p2, { color: 'orange', width: 1.8, dash: [6, 4] }));
          budget(s, P, p2, M);
          // indifference curves
          drawLevel(s, F, uA, { color: 'purple', width: 2.4 });
          if (k === 'slutsky' && Math.abs(F.u(...B) - uA) > 1e-6 * Math.abs(uA)) drawLevel(s, F, F.u(...B), { color: v.color('purple', 0.45), width: 1.2, dash: [4, 4] });
          drawLevel(s, F, F.u(...C), { color: v.color('purple', 0.6), width: 1.5 });
          // compensation bracket on the x2 axis
          const y0 = M / p2, y1 = mc / p2;
          if (Math.abs(y1 - y0) * (s.height / 13) > 12) {
            const top = 12.85, ya = Math.min(y1, top);
            if (y1 <= top) s.measure(0.3, y0, 0.3, y1, null, { color: 'orange' }); else s.arrow(0.3, y0, 0.3, top, { color: 'orange', width: 1.4, head: 7 });
            s.text(`Δm = ${sgn(mc - M)}${y1 > top ? ' (line leaves the chart)' : ''}`, 0.45, (y0 + ya) / 2, { dx: 6, color: 'orange', ...LBL, align: 'left', plate: true });
          }
          // arrows and points
          trimArrow(s, A, B, { color: 'orange', width: 3.2, head: 11 });
          trimArrow(s, B, C, { color: 'teal', width: 3.2, head: 11 });
          const close = (a, b) => Math.hypot(s.X(a[0]) - s.X(b[0]), s.Y(a[1]) - s.Y(b[1])) < 16;
          s.dot(A[0], A[1], { r: 6, color: 'ink', label: 'A', labelPos: 'ne' });
          s.dot(B[0], B[1], { r: 6, color: 'orange', label: close(A, B) ? null : 'B', labelPos: P > P0 ? 'w' : 'e' });
          s.dot(C[0], C[1], { r: 6.5, color: 'green', label: close(B, C) ? (close(A, C) ? null : 'B = C') : 'C', labelPos: 'sw', math: !close(B, C) });
          // demand diagram
          const cv = curves(`${kf}|${k}`, F, k, A, uA);
          d.clip(() => { d.path(cv.mar, { color: 'accent', width: 2.6 }); d.path(cv.cmpc, { color: 'orange', width: 2.2, dash: [7, 4] }); });
          d.hline(P0, { color: 'muted', width: 1, dash: [3, 3] }); d.hline(P, { color: 'muted', width: 1, dash: [3, 3] });
          const dy = 7 / (d.height / 2.8);
          d.line(A[0], P0, A[0], P, GUIDE);
          if (Math.abs(B[0] - A[0]) * d.scale > 8) d.arrow(A[0], P + dy, B[0], P + dy, { color: 'orange', width: 2.8, head: 9 });
          if (Math.abs(C[0] - B[0]) * d.scale > 8) d.arrow(B[0], P - dy, C[0], P - dy, { color: 'teal', width: 2.8, head: 9 });
          d.dot(A[0], P0, { r: 6, color: 'ink', label: 'A', labelPos: 'ne' });
          d.dot(B[0], P, { r: 5.5, color: 'orange', label: Math.abs(B[0] - C[0]) * d.scale < 14 ? null : 'B', labelPos: 'n' });
          d.dot(C[0], P, { r: 6, color: 'green', label: 'C', labelPos: 's' });
          const lab = (pts, txt, col, dyy) => { const q = pts.find((z) => z[0] <= 12.5 && z[1] > 2.35); if (q) d.text(txt, q[0], q[1], { dx: 8, dy: dyy, color: col, ...LBL, align: 'left' }); };
          lab(cv.mar, 'ordinary', 'accent', 6); lab(cv.cmpc, k === 'slutsky' ? 'Slutsky-compensated' : 'Hicksian', 'orange', -10);
          const hk = k === 'slutsky' ? hicks(F, P, p2, uA).e : mc, sl = M + A[0] * (P - P0);
          st = { kf, k, P, A, B, C, mc, hk, sl, uB: F.u(...B), uA };
        });
        v.readout(() => {
          const { kf, k, P, A, B, C, mc, hk, sl } = st, f = (q) => v.fix(q, 2);
          const sub = B[0] - A[0], inc = C[0] - B[0], tot = C[0] - A[0];
          const head = `$p_1$: 1 → ${f(P)}. Substitution effect on $x_1$: ${sgn(sub)}; income effect: ${sgn(inc)}; total: ${sgn(sub)} ${inc >= 0 ? '+' : '−'} ${Math.abs(inc).toFixed(2)} = ${sgn(tot)} (from ${f(A[0])} to ${f(C[0])}).`;
          const comp = k === 'slutsky' ? ` Slutsky compensation $x_1^A\\,\\Delta p_1 = ${f(sl - 10)}$ makes $A$ affordable again; Hicks compensation, just enough to reach $A$'s curve, would be ${f(hk - 10)}${Math.abs(P - 1) > 0.05 && kf !== 'comp' ? ', less, because at $B$ the consumer is better off than at $A$' : ''}.` : ` Hicks compensation $e(p', u_A) - m = ${f(mc - 10)}$ keeps the consumer on $A$'s curve; Slutsky's rule would give ${f(sl - 10)}.`;
          const note = { cd: '', ces: ' Good substitutes: a large substitution effect.', comp: ' Perfect complements: $B$ = $A$ under Hicks compensation, so the whole change is an income effect.', ql: ' Quasilinear: income changes go entirely to good 2, so $C$ is directly below $B$: no income effect on good 1.', inf: ' Good 1 is **inferior**: losing purchasing power makes the consumer buy *more* of it, so the income effect partly offsets the substitution effect.' }[kf];
          return head + comp + note;
        });
      },
    },
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2', kind: 'Theorem', name: 'Slutsky equation',
      statement: String.raw`Let Marshallian demand $x(p, m)$ and Hicksian demand $h(p, u)$ be differentiable, and let $u = v(p, m)$ be the utility reached. Then for all goods $i, j$
$$\frac{\partial x_i(p, m)}{\partial p_j} \;=\; \frac{\partial h_i(p, u)}{\partial p_j} \;-\; x_j(p, m)\,\frac{\partial x_i(p, m)}{\partial m}.$$
The total effect of a price change is the substitution effect (the slope of compensated demand) plus the income effect. The matrix $S = \big[\partial h_i/\partial p_j\big]$, computable from observable Marshallian demand as $\partial x_i/\partial p_j + x_j\,\partial x_i/\partial m$, is the **Slutsky matrix**. If demand comes from maximizing a locally non-satiated, continuous utility, $S$ is **symmetric**, **negative semidefinite** ($z^\top S z \le 0$ for every $z$) and satisfies $Sp = 0$; in particular every own-price substitution effect $S_{ii}$ is $\le 0$. Conversely, a demand system satisfying these conditions (with homogeneity and the budget identity) can be derived from some utility function (the integrability problem).`,
      idea: String.raw`Duality (5.11) says that buying $h(p, u)$ costs exactly $e(p, u)$, and that $h(p, u) = x(p, e(p, u))$ for all prices. Differentiate this identity in $p_j$ with the chain rule (Rudin 9.15): $\partial h_i/\partial p_j = \partial x_i/\partial p_j + (\partial x_i/\partial m)(\partial e/\partial p_j)$, and Shephard's lemma (5.12) gives $\partial e/\partial p_j = h_j = x_j$. Rearranging is the Slutsky equation. The properties of $S$ come from the expenditure function: $S_{ij} = \partial^2 e/\partial p_i\partial p_j$ is the Hessian of a concave function (5.12), hence symmetric and negative semidefinite, and $e$ is homogeneous of degree 1 in $p$, which gives $Sp = 0$ by Euler's theorem.`,
      caption: String.raw`**One price**: the left panel shows the ordinary (blue) and compensated (orange) demand curves crossing at $A$. A finite price step $\Delta p_1$ splits the move into a substitution part (orange) and an income part (teal). The right panel plots the three finite-difference slopes against the step on a log scale: as you shrink the step they settle onto the dashed derivative values, and the bars below always add up. **Slutsky matrix**: three goods. The matrix is computed from Marshallian demand alone. The lower panel plots $z^\top S z$ for every price direction $z \perp p$. Choose a demand system that **does not come from a utility** and watch symmetry fail, or one whose shares rise with own price and watch negative semidefiniteness fail.`,
      deps: ['micro-6.1', 'micro-5.10', 'pma-9.15', 'micro-5.12'], refs: ['Varian Ch. 8'], tags: ['demand', 'decomposition'],
      see: ['micro-5.10', 'micro-5.13', 'micro-6.12'],
      credit: 'Eugen Slutsky, 1915',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Slutsky_equation' },
      viz(v) {
        const p2 = 1, M = 10;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.45 }) },
          ces2: { label: 'CES, $\\sigma = 2$', F: prefs('ces', { a: 0.5, r: 0.5 }) },
          cesh: { label: 'CES, $\\sigma = \\tfrac12$', F: prefs('ces', { a: 0.5, r: -1 }) },
          inf: { label: 'inferior good 1', F: prefs('inf', { A: 12, k: 8 }) },
        };
        const SYS = {
          cd: { label: 'Cobb–Douglas', sh: (p) => [0.2, 0.3, 0.5] },
          ces: { label: 'CES, $\\sigma = \\tfrac12$', sh: (p) => { const a = [0.2, 0.3, 0.5], w = a.map((ai, i) => ai ** 0.5 * p[i] ** 0.5), W = w[0] + w[1] + w[2]; return w.map((z) => z / W); } },
          cyc: { label: 'cyclic shares (no utility)', sh: (p) => { const P = p[0] + p[1] + p[2]; return [p[1] / P, p[2] / P, p[0] / P]; } },
          up: { label: 'shares rise with own price', sh: (p) => { const w = p.map((q) => q * q), W = w[0] + w[1] + w[2]; return w.map((z) => z / W); } },
        };
        const mode = v.select('show', [{ value: 'one', label: 'one price: the identity' }, { value: 'mat', label: 'all prices: the Slutsky matrix' }], 'one');
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const sys = v.select('demand system', Object.entries(SYS).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const p1 = v.slider('price $p_1$', 0.5, 2.5, 1.2, { step: 0.01 });
        const dp = v.slider('price step $\\Delta p_1$', 0.001, 1, 0.5, { log: true });
        const q1 = v.slider('price $p_1$ (good 3 costs 1)', 0.3, 3, 1.6, { step: 0.01 });
        const q2 = v.slider('price $p_2$', 0.3, 3, 0.8, { step: 0.01 });
        const L = v.stage({ x: [0, 10], y: [0, 3.6], height: 330, axes: 'box', xlabel: 'x₁', ylabel: 'p₁', title: 'demand curves through $A$' });
        const R = v.stage({ x: [0.001, 1], y: [-5, 1], height: 330, axes: 'box', xlog: true, xlabel: 'price step Δp₁ (log scale)', ylabel: 'slope', title: 'finite-difference slopes converge' });
        const B = v.stage({ x: [-5, 2], y: [0, 3], height: 120, axes: false, full: true, title: 'substitution (orange) + income (teal) = total (green bracket): at this step and in the limit' });
        const T = v.stage({ x: [0, 1], y: [0, 1], height: 300, axes: false, title: 'Slutsky matrix $S_{ij} = \\partial x_i/\\partial p_j + x_j\\,\\partial x_i/\\partial m$' });
        const Q = v.stage({ x: [0, 180], y: [-1, 1], height: 300, axes: 'box', xlabel: 'direction θ of the price change z ⊥ p (degrees)', ylabel: 'zᵀSz', title: 'the quadratic form on directions with $z \\cdot p = 0$', xticks: [0, 45, 90, 135, 180] });
        const tab = v.table(T, { rows: 3, cols: 4, square: false, cellAspect: 1.45, maxCell: 70, size: 14, rowLabels: ['$x_1$', '$x_2$', '$x_3$'], colLabels: ['$p_1$', '$p_2$', '$p_3$', '$(Sp)_i$'], cornerLabel: '' });
        const sysDemand = (key, p, m) => SYS[key].sh(p).map((sh, i) => (sh * m) / p[i]);
        const cache = {};
        const curvesFor = (k, P) => { const key = `${k}|${P}`; if (cache[key]) return cache[key]; const F = FAM[k].F, x = demand(F, P, p2, M), u = F.u(...x), mar = [], hk = []; for (let i = 0; i <= 90; i++) { const q = 0.2 + (3.4 * i) / 90; mar.push([demand(F, q, p2, M)[0], q]); hk.push([hicks(F, q, p2, u).x[0], q]); } return (cache[key] = { mar, hk }); };
        let st = {};
        v.render(() => {
          const one = mode.value === 'one';
          fam.el.hidden = !one; p1.el.hidden = !one; dp.el.hidden = !one; sys.el.hidden = one; q1.el.hidden = one; q2.el.hidden = one;
          for (const S of [L, R, B]) showStage(S, one);
          for (const S of [T, Q]) showStage(S, !one);
          v.legend(one ? [['accent', 'ordinary demand x₁(p₁, m)'], ['orange', 'compensated h₁(p₁, u_A); substitution'], ['teal', 'income term'], ['green', 'total']] : [['green', 'zᵀSz ≤ 0 (negative semidefinite)', { area: true }], ['red', 'zᵀSz > 0: no utility can produce this', { area: true }]]);
          if (one) {
            const k = fam.value, F = FAM[k].F, P = p1.value, D = dp.value;
            const sl = slutsky(F, P, p2, M), A = sl.x, uA = sl.L;
            const ratios = (h) => { const xc = demand(F, P + h, p2, M)[0], hc = hicks(F, P + h, p2, uA).x[0]; const T_ = (xc - A[0]) / h, S_ = (hc - A[0]) / h; return [T_, S_, T_ - S_, xc, hc]; };
            const [Tt, Ss, Ii, xc, hc] = ratios(D);
            // demand diagram
            const cv = curvesFor(k, P);
            L.setView([0, Math.min(10, Math.max(...cv.mar.map((q) => q[0])) * 1.05 + 0.5)], [0, 3.6]);
            L.clip(() => { L.path(cv.mar, { color: 'accent', width: 2.6 }); L.path(cv.hk, { color: 'orange', width: 2.4, dash: [7, 4] }); });
            L.hline(P, { color: 'muted', width: 1, dash: [3, 3] }); L.hline(P + D, { color: 'muted', width: 1, dash: [3, 3] });
            const dy = 6 / (L.height / 3.6);
            L.line(A[0], P, A[0], P + D, GUIDE);
            if (Math.abs(hc - A[0]) * L.scale > 7) L.arrow(A[0], P + D + dy, hc, P + D + dy, { color: 'orange', width: 2.6, head: 8 });
            if (Math.abs(xc - hc) * L.scale > 7) L.arrow(hc, P + D - dy, xc, P + D - dy, { color: 'teal', width: 2.6, head: 8 });
            L.dot(A[0], P, { r: 6, color: 'ink', label: 'A', labelPos: 'sw' });
            L.dot(hc, P + D, { r: 5, color: 'orange' }); L.dot(xc, P + D, { r: 5.5, color: 'green' });
            L.text(`p₁ + Δp₁ = ${v.fix(P + D, 3)}`, L.bounds.x[1], P + D, { dx: -6, dy: -11, color: 'muted', size: 11.5, weight: 600, align: 'right' });
            // convergence panel
            const hs = []; for (let i = 0; i <= 60; i++) hs.push(10 ** (-3 + (3 * i) / 60));
            const rr = hs.map(ratios);
            const all = [...rr.flatMap((q) => q.slice(0, 3)), sl.dx, sl.dh, sl.inc].filter(isFinite), lo = Math.min(...all), hi = Math.max(...all), pd = 0.12 * (hi - lo || 1);
            R.setView([0.001, 1], [lo - 1.8 * pd, hi + pd]);
            R.hline(0, { color: 'faint', width: 1 });
            [[sl.dx, 'green'], [sl.dh, 'orange'], [sl.inc, 'teal']].forEach(([y, c]) => R.hline(y, { color: c, width: 1.3, dash: [6, 4], alpha: 0.8 }));
            [[0, 'green'], [1, 'orange'], [2, 'teal']].forEach(([j, c]) => R.path(hs.map((h, i) => [h, rr[i][j]]), { color: c, width: 2.6 }));
            R.vline(D, GUIDE);
            R.dot(D, Tt, { r: 5, color: 'green' }); R.dot(D, Ss, { r: 5, color: 'orange' }); R.dot(D, Ii, { r: 5, color: 'teal' });
            const lbl = [[sl.dx, 'green', '∂x₁/∂p₁'], [sl.dh, 'orange', '∂h₁/∂p₁'], [sl.inc, 'teal', '−x₁ ∂x₁/∂m']].sort((a, b) => b[0] - a[0]);
            let lastY = -1e9; lbl.forEach(([y, c, t]) => { let Y = R.Y(y) - 9; if (Y - lastY < 15) Y = lastY + 15; lastY = Y; R.textPx(t, 62, Y, { color: c, size: 11.5, weight: 700, align: 'left' }); });
            // bars
            const ends = [0, Ss, Ss + Ii, Tt, sl.dh, sl.dh + sl.inc, sl.dx], blo = Math.min(...ends), bhi = Math.max(...ends), span = bhi - blo || 1;
            B.setView([blo - 0.75 * span, bhi + 0.06 * span], [0, 3]);
            const W = span, xl = blo - 0.73 * span;
            B.line(0, 0.2, 0, 2.9, { color: 'ink', width: 1.2 });
            // stacked: substitution then income, on the top row; total on the bottom row
            const bar = (x0, x1, y, col, outline) => B.rect(x0, y - 0.28, x1, y + 0.28, outline ? { color: col, width: 2, fill: col, fillAlpha: 0.12, radius: 3 } : { fill: col, fillAlpha: 0.72, stroke: false, radius: 3 });
            const tot = (t, y) => { B.line(0, y - 0.45, t, y - 0.45, { color: 'green', width: 3 }); B.line(t, y - 0.55, t, y + 0.32, { color: 'green', width: 2 }); };
            bar(0, Ss, 2.2, 'orange'); bar(Ss, Ss + Ii, 2.2, 'teal'); tot(Tt, 2.2);
            bar(0, sl.dh, 0.95, 'orange', true); bar(sl.dh, sl.dh + sl.inc, 0.95, 'teal', true); tot(sl.dx, 0.95);
            const par = (q) => (q < 0 ? `(${v.fix(q, 3)})` : v.fix(q, 3));
            B.text(`step ${v.fix(D, D < 0.01 ? 4 : 3)}:  ${v.fix(Ss, 3)} + ${par(Ii)} = ${v.fix(Tt, 3)}`, xl, 2.2, { color: 'ink', ...LBL, align: 'left' });
            B.text(`limit:  ${v.fix(sl.dh, 3)} + ${par(sl.inc)} = ${v.fix(sl.dx, 3)}`, xl, 0.95, { color: 'ink', ...LBL, align: 'left' });
            st = { one, k, P, D, sl, Tt, Ss, Ii };
          }
          { // the matrix mode is drawn even while hidden (cheap), so its panels are never blank
            const key = sys.value, p = [q1.value, q2.value, 1], m = M, h = 1e-5, x = sysDemand(key, p, m);
            const dm = sysDemand(key, p, m + h).map((z, i) => (z - sysDemand(key, p, m - h)[i]) / (2 * h));
            const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
            for (let j = 0; j < 3; j++) { const pp = p.slice(), pm = p.slice(); pp[j] += h; pm[j] -= h; const a = sysDemand(key, pp, m), b = sysDemand(key, pm, m); for (let i = 0; i < 3; i++) S[i][j] = (a[i] - b[i]) / (2 * h) + x[j] * dm[i]; }
            const Sp = S.map((r) => r[0] * p[0] + r[1] * p[1] + r[2] * p[2]);
            const big = Math.max(...S.flat().map(Math.abs)) || 1;
            let asym = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) asym = Math.max(asym, Math.abs(S[i][j] - S[j][i]));
            const sym = S.map((r, i) => r.map((z, j) => (z + S[j][i]) / 2)), ev = v.M.eigSym(sym).values;
            tab.draw({
              value: (i, j) => (j < 3 ? v.fix(S[i][j], 3) : v.fix(Math.abs(Sp[i]) < 5e-5 ? 0 : Sp[i], 4)),
              fill: (i, j) => (j === 3 ? ['muted', 0.12] : [S[i][j] < 0 ? 'blue' : 'red', 0.12 + 0.5 * Math.abs(S[i][j]) / big]),
              textColor: (i, j) => (j < 3 && i !== j && Math.abs(S[i][j] - S[j][i]) > 1e-3 * big ? 'red' : 'ink'),
              weight: (i, j) => (i === j ? 700 : 500),
            });
            // the quadratic form on the plane orthogonal to p
            const n = Math.hypot(...p), pn = p.map((z) => z / n), e1n = Math.hypot(p[0], p[1]), e1 = [p[1] / e1n, -p[0] / e1n, 0];
            const e2 = [pn[1] * e1[2] - pn[2] * e1[1], pn[2] * e1[0] - pn[0] * e1[2], pn[0] * e1[1] - pn[1] * e1[0]];
            const qf = (deg) => { const t = (deg * Math.PI) / 180, z = [0, 1, 2].map((i) => Math.cos(t) * e1[i] + Math.sin(t) * e2[i]); let q = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) q += z[i] * S[i][j] * z[j]; return q; };
            const qs = []; for (let d = 0; d <= 180; d += 1) qs.push(qf(d));
            const qlo = Math.min(0, ...qs), qhi = Math.max(0, ...qs), pad = 0.15 * (qhi - qlo || 1);
            Q.setView([0, 180], [qlo - pad, qhi + pad]);
            Q.between((d) => Math.min(0, qf(d)), () => 0, 0, 180, { fill: 'green', fillAlpha: 0.2, n: 180 });
            Q.between((d) => Math.max(0, qf(d)), () => 0, 0, 180, { fill: 'red', fillAlpha: 0.3, n: 180 });
            Q.hline(0, { color: 'ink', width: 1.2 });
            Q.fn(qf, { domain: [0, 180], color: qhi > 1e-9 ? 'red' : 'green', width: 2.6, n: 180 });
            if (!one) st = { one, key, p, S, Sp, asym, ev, qhi, qlo, big, qmax: Math.max(...qs) };
          }
        });
        v.readout(() => {
          const S = st, f3 = (q) => v.fix(q, 3);
          if (S.one) {
            const err = S.sl.dx - S.sl.dh - S.sl.inc;
            const par = (q) => (q < 0 ? `(${f3(q)})` : f3(q));
            return `At $p_1 = ${v.fix(S.P, 2)}$: $\\partial x_1/\\partial p_1 = ${f3(S.sl.dx)}$, $\\partial h_1/\\partial p_1 = ${f3(S.sl.dh)}$ and $-x_1\\,\\partial x_1/\\partial m = ${v.fix(-S.sl.x[0], 3)} \\times ${par(S.sl.dm)} = ${f3(S.sl.inc)}$, each computed separately by finite differences. Their sum is ${f3(S.sl.dh + S.sl.inc)}, and the Slutsky identity holds to $${v.sci(Math.abs(err) + 1e-16, 1)}$. With the finite step $\\Delta p_1 = ${v.fix(S.D, S.D < 0.01 ? 4 : 3)}$ the slopes are ${f3(S.Ss)} + ${par(S.Ii)} = ${f3(S.Tt)}: off by ${v.fix(Math.abs(S.Tt - S.sl.dx), 4)}, an error proportional to the step.`;
          }
          const evs = S.ev.map((z) => v.fix(Math.abs(z) < 5e-6 ? 0 : z, 3)).join(', ');
          const symTxt = S.asym < 1e-5 * S.big ? 'symmetric (largest $|S_{ij} - S_{ji}|$ is $< 10^{-5}$)' : `**not symmetric**: $|S_{ij} - S_{ji}|$ reaches ${f3(S.asym)} (red entries), so no utility function generates this demand, although it is homogeneous and spends exactly $m$`;
          const nsd = S.qhi > 1e-6 * S.big ? `**not negative semidefinite**: $z^\\top S z$ reaches ${f3(S.qhi)} > 0, so for some compensated price change demand moves *with* prices` : `negative semidefinite: $z^\\top S z \\le 0$ in every direction (largest ${v.fix(S.qmax, 3)})`;
          return `With prices $(${v.fix(S.p[0], 2)}, ${v.fix(S.p[1], 2)}, 1)$ and $m = 10$ the matrix is ${symTxt}; $Sp = 0$ to $10^{-6}$ (last column), and it is ${nsd}. Eigenvalues of $\\tfrac12(S + S^\\top)$: ${evs} (one is zero because $Sp = 0$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3', kind: 'Phenomenon', name: 'Giffen goods',
      statement: String.raw`A good is a **Giffen good** for a consumer, over some range of prices, if demand for it *rises* when its own price rises: $\partial x_1/\partial p_1 > 0$. By the Slutsky equation (6.2), $\partial x_1/\partial p_1 = \partial h_1/\partial p_1 - x_1\,\partial x_1/\partial m$ with $\partial h_1/\partial p_1 \le 0$, so this requires that the good be **inferior** ($\partial x_1/\partial m < 0$) and that the income effect, which is large when the good takes a big share of the budget, outweigh the substitution effect; in elasticities, $\varepsilon = \varepsilon^h - s_1\,\eta$ with budget share $s_1$ and income elasticity $\eta$. Compensated demand never slopes upward, and a Giffen good cannot be Giffen at all incomes.

Evidence: Marshall (1895) attributed the idea to Robert Giffen and illustrated it with bread among poor labouring families; the textbook story of potatoes in the Irish famine of 1845–49 does not survive scrutiny (Dwyer and Lindsay 1984; Rosen 1999). Jensen and Miller (2008) gave randomly chosen poor urban households in Hunan and Gansu vouchers that lowered the price of their staple for five months in 2006. Households in Hunan that were poor but not destitute bought *less* rice when it was subsidized (an estimated price elasticity around $+0.45$), and the evidence for wheat in Gansu was weaker.`,
      idea: String.raw`The mechanism is subsistence. A poor household needs a minimum of calories. The staple (rice) supplies them cheaply, while meat tastes better but costs more per calorie. Such a household eats just enough calories, spending what is left on meat. When rice gets dearer it can no longer afford its old diet, and keeping up its calories means switching from meat to rice, the cheapest calories still available, so it buys *more* rice. In Slutsky's terms rice is strongly inferior here and takes most of the budget, so the income effect swamps the small substitution effect. The very poorest, who already eat only rice, must cut back when its price rises, and households rich enough to have slack in their calories behave normally. This gives the inverted-U pattern of price responses across incomes that Jensen and Miller found.`,
      caption: String.raw`The model consumer's utility is a smooth minimum of a calorie index (rice and meat each give one unit of calories per unit; the dashed red line is the need) and a taste index that strongly prefers meat. Raise the price of rice from *before* to *after*: the orange arrow (substitution, along the old indifference curve) points left, the teal arrow (income) points right and is longer, so the consumer ends at $C$ with more rice. The right panel is the demand curve for rice, gold where it slopes upward. The bottom panel plots the price elasticity of rice demand against income. Set the **calorie need** to 0 and rice becomes an ordinary good.`,
      deps: ['micro-6.2'], refs: ['Varian Ch. 6', 'Mankiw Ch. 21', 'Jensen & Miller, AER 98(4), 2008'], tags: ['demand'],
      see: ['micro-6.1', 'micro-5.8'],
      credit: 'Alfred Marshall (after Robert Giffen), 1895; Robert Jensen and Nolan Miller, 2008',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Giffen_good' },
      viz(v) {
        const p2 = 1;
        const need = v.slider('calorie need $\\bar c$', 0, 9, 8, { step: 0.1 });
        const m = v.slider('income $m$', 3, 10, 6, { step: 0.05 });
        const pa = v.slider('price of rice before', 0.25, 0.85, 0.4, { step: 0.01 });
        const pb = v.slider('price of rice after', 0.25, 0.85, 0.6, { step: 0.01 });
        const s = v.stage({ x: [0, 13], y: [0, 9], height: 360, axes: 'box', xlabel: 'rice x₁', ylabel: 'meat x₂', weight: 1.2, title: 'diet choice (meat costs $p_2 = 1$)' });
        const d = v.stage({ x: [0, 13], y: [0.2, 0.95], height: 360, axes: 'box', xlabel: 'rice x₁', ylabel: 'price of rice p₁', title: 'demand for rice' });
        const e = v.stage({ x: [2, 12], y: [-2, 2], height: 170, axes: 'box', full: true, xlabel: 'income m', ylabel: 'elasticity', title: 'price elasticity of rice demand against income, at the price before' });
        v.legend([['red', 'calorie need', { dash: true }], ['muted', 'budget before', { dash: true }], ['accent', 'budget after'], ['orange', 'substitution A → B'], ['teal', 'income B → C'], ['gold', 'upward-sloping demand']]);
        const cache = {};
        const FAMc = (C) => cache[`F${C}`] || (cache[`F${C}`] = prefs('giffen', { C }));
        let st = {};
        v.render(() => {
          const C = need.value, F = FAMc(C), M = m.value, P = pa.value, P1 = pb.value;
          const A = demand(F, P, p2, M), uA = F.u(...A), C1 = demand(F, P1, p2, M), H = hicks(F, P1, p2, uA), Bx = H.x;
          // hunger region and calorie line
          if (C > 0.05) { s.clip(() => s.poly([[0, 0], [C, 0], [0, C]], { fill: 'red', fillAlpha: 0.06, stroke: false })); s.clip(() => s.line(C, 0, 0, C, { color: 'red', width: 1.8, dash: [6, 4] })); if (C > 2) s.text(`below the dashed line: fewer calories than the need ${v.fix(C, 1)}`, 0.3, 0.55, { color: 'red', ...LBL, align: 'left', plate: true }); }
          // indifference map (faint)
          for (const t of [0.25, 0.5, 0.75]) { const q = demand(F, 0.5, p2, 3 + 7 * t); drawLevel(s, F, F.u(...q), { color: v.color('purple', 0.18), width: 1 }); }
          bline(s, P, p2, M, { color: 'muted', width: 1.8, dash: [7, 5] });
          s.clip(() => s.line(H.e / P1, 0, 0, H.e / p2, { color: 'orange', width: 1.6, dash: [6, 4] }));
          budget(s, P1, p2, M);
          drawLevel(s, F, uA, { color: 'purple', width: 2.4 });
          drawLevel(s, F, F.u(...C1), { color: v.color('purple', 0.6), width: 1.5 });
          trimArrow(s, A, Bx, { color: 'orange', width: 3.2, head: 11 });
          trimArrow(s, Bx, C1, { color: 'teal', width: 3.2, head: 11 });
          s.dot(A[0], A[1], { r: 6, color: 'ink', label: 'A', labelPos: 'ne' });
          s.dot(Bx[0], Bx[1], { r: 5.5, color: 'orange', label: 'B', labelPos: 'nw' });
          s.dot(C1[0], C1[1], { r: 6.5, color: 'green', label: 'C', labelPos: 'se' });
          // demand curve with the upward stretches in gold
          const ps = []; for (let i = 0; i <= 140; i++) ps.push(0.2 + (0.75 * i) / 140);
          const xs = ps.map((q) => demand(F, q, p2, M)[0]);
          const xmax = Math.max(...xs), xmin = Math.min(...xs), xr = Math.max(3, xmax - xmin); d.setView([Math.max(0, xmin - 0.25 * xr), xmax + 0.25 * xr], [0.2, 0.95]);
          d.path(ps.map((q, i) => [xs[i], q]), { color: 'accent', width: 2.6 });
          let up = 0;
          for (let i = 1; i < ps.length; i++) if (xs[i] > xs[i - 1] + 1e-9) { d.line(xs[i - 1], ps[i - 1], xs[i], ps[i], { color: 'gold', width: 6, alpha: 0.85 }); up++; }
          d.path(ps.map((q, i) => [xs[i], q]), { color: 'accent', width: 1.6 });
          d.hline(P, { color: 'muted', width: 1, dash: [3, 3] }); d.hline(P1, { color: 'muted', width: 1, dash: [3, 3] });
          d.dot(A[0], P, { r: 6, color: 'ink', label: 'A', labelPos: 'nw' }); d.dot(C1[0], P1, { r: 6.5, color: 'green', label: 'C', labelPos: 'nw' });
          const giff = C1[0] > A[0] + 1e-6 === P1 > P;
          if (up) { const j = xs.findIndex((z, i) => i > 0 && z > xs[i - 1]); const jj = xs.findLastIndex((z, i) => i > 0 && z > xs[i - 1]); const mid = Math.round((j + jj) / 2); d.text('Giffen range', xs[mid], ps[mid], { dx: 12, color: 'gold', ...LBL, align: 'left', plate: true }); }
          // elasticity across incomes, at the price before
          const ms = []; for (let i = 0; i <= 80; i++) ms.push(2 + (10 * i) / 80);
          const h = 1e-4, el = ms.map((q) => { const a = demand(F, P + h, p2, q)[0], b = demand(F, P - h, p2, q)[0], x0 = demand(F, P, p2, q)[0]; return x0 > 1e-9 ? ((a - b) / (2 * h)) * (P / x0) : NaN; });
          const emax = Math.max(1, ...el.filter(isFinite)), emin = Math.min(-1.5, ...el.filter(isFinite));
          e.setView([2, 12], [Math.max(emin, -6) * 1.1, emax * 1.15]);
          e.between((q) => { const i = clamp(Math.round(((q - 2) / 10) * 80), 0, 80); return Math.max(0, el[i] || 0); }, () => 0, 2, 12, { fill: 'gold', fillAlpha: 0.3, n: 160 });
          e.hline(0, { color: 'ink', width: 1.2 });
          e.clip(() => e.path(ms.map((q, i) => [q, el[i]]), { color: 'accent', width: 2.6 }));
          const iM = clamp(Math.round(((M - 2) / 10) * 80), 0, 80); e.vline(M, GUIDE); if (isFinite(el[iM])) e.dot(M, el[iM], { r: 5.5, color: 'ink' });
          // the three regimes: rice only / subsistence (Giffen) / fed
          const only = ms.findIndex((q) => demand(F, P, p2, q)[1] > 1e-6), pos = el.map((z) => z > 0), g0 = pos.indexOf(true), g1 = pos.lastIndexOf(true);
          const yl = e.bounds.y[1] - 0.14 * (e.bounds.y[1] - e.bounds.y[0]);
          if (only > 6) e.text('rice only', (2 + ms[only]) / 2, yl, { color: 'muted', ...LBL, align: 'center', plate: true });
          if (g0 >= 0 && g1 - g0 > 6) e.text('subsistence: Giffen', (ms[g0] + ms[g1]) / 2, yl, { color: 'gold', ...LBL, align: 'center', plate: true });
          if (g1 >= 0 && g1 < 72) e.text('fed: ordinary', (ms[g1] + 12) / 2, yl, { color: 'muted', ...LBL, align: 'center', plate: true });
          const sl = slutsky(F, P, p2, M);
          st = { C, M, P, P1, A, Bx, C1, sl, giff, cal: A[0] + A[1], up };
        });
        v.readout(() => {
          const { C, M, P, P1, A, Bx, C1, sl, cal } = st, f = (q) => v.fix(q, 2);
          const regime = A[1] < 1e-6 ? `This household is so poor that it eats only rice (${f(A[0])} units, ${f(cal)} calories against a need of ${f(C)}); a dearer staple forces it to buy less, the ordinary way.` : sl.dm < 0 ? `It eats ${f(A[0])} rice and ${f(A[1])} meat (${f(cal)} calories, need ${f(C)}). Rice is **inferior** here: extra income buys meat and *less* rice ($\\partial x_1/\\partial m = ${v.fix(sl.dm, 2)}$), the subsistence zone.` : `It eats ${f(A[0])} rice and ${f(A[1])} meat (${f(cal)} calories, need ${f(C)}): calories are no longer the worry and rice is a normal good ($\\partial x_1/\\partial m = ${v.fix(sl.dm, 2)}$).`;
          const g = sl.dx > 0;
          const verdict = g ? `**Giffen**: the income effect ${sgn(sl.inc)} outweighs the substitution effect ${sgn(sl.dh)} (${v.fix(Math.abs(sl.inc / sl.dh), 1)} times larger), so $\\partial x_1/\\partial p_1 = ${sgn(sl.dx)} > 0$.` : `Not Giffen here: substitution effect ${sgn(sl.dh)}, income effect ${sgn(sl.inc)}, total $\\partial x_1/\\partial p_1 = ${sgn(sl.dx)}$.`;
          return `${regime} Slutsky terms at $p_1 = ${f(P)}$: ${verdict} For the price change to ${f(P1)}: substitution ${sgn(Bx[0] - A[0])}, income ${sgn(C1[0] - Bx[0])}, total ${sgn(C1[0] - A[0])} units of rice.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4', kind: 'Definition', name: 'Revealed preference',
      statement: String.raw`A record of choices is a finite list of observations $(p^t, x^t)$, $t = 1, \dots, T$: at prices $p^t$ the consumer bought the bundle $x^t$, spending $p^t\cdot x^t$.
- $x^t$ is **directly revealed preferred** to a bundle $y$, written $x^t\,R\,y$, if $y$ was affordable when $x^t$ was chosen: $p^t\cdot y \le p^t\cdot x^t$. It is **strictly** directly revealed preferred, $x^t\,P\,y$, if $p^t\cdot y < p^t\cdot x^t$.
- $x^t$ is **indirectly revealed preferred** to $y$, written $x^t\,R^*\,y$, if there is a chain $x^t\,R\,x^{s}\,R\,\cdots\,R\,y$. So $R^*$ is the transitive closure of $R$.
The bundles **revealed worse** than $x^t$ form the union of the budget sets of $x^t$ and of every observation that $x^t$ is revealed preferred to. If the choices maximize a locally non-satiated utility $u$, then $x\,R\,y$ implies $u(x) \ge u(y)$, $x\,P\,y$ implies $u(x) > u(y)$, and by transitivity $x\,R^*\,y$ implies $u(x) \ge u(y)$.`,
      idea: String.raw`Revealed preference, introduced by Samuelson in 1938, reverses the direction of consumer theory. Instead of deriving choices from a utility function, it reads preferences off the choices: whatever the consumer could have bought but did not buy cannot be better than what she bought. The argument needs only that she optimizes on her budget set (5.1), plus local non-satiation for the strict version, since a bundle strictly inside the budget set leaves money that could buy something better. Chains matter because preferences are transitive. If $x^1$ was chosen when $x^2$ was affordable, and $x^2$ when $x^3$ was affordable, then $x^1$ is at least as good as $x^3$, even if the two were never on offer together. Bundles outside every revealed-worse set stay unranked: a finite record says nothing about them. Whether the revealed relation is consistent at all is the subject of 6.5 and 6.6.`,
      caption: String.raw`Each observation is a chosen bundle $x^t$ (large handle) and a budget line through it; turn the line with the small knob. An arrow $x^t \to x^s$ means $x^s$ was affordable when $x^t$ was chosen, and a dashed arrow means the ranking only follows through a chain. Drag or click an observation: everything revealed worse than it is shaded in its colour, including the budget sets reached through chains. The table lists the cost of every bundle at every observation's prices (green: affordable, so revealed worse). Move the gold test bundle $z$ to see whether the record ranks it.`,
      deps: ['micro-5.1'], refs: ['Varian Ch. 7'], tags: ['revealed preference'],
      see: ['micro-4.3', 'micro-4.1'],
      credit: 'Paul Samuelson, 1938; Hendrik Houthakker, 1950',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Revealed_preference' },
      viz(v) {
        const COLS = OBS_COLS;
        const PRE = {
          chain: [{ x: [2, 8], k: 1.6 }, { x: [4.5, 3.5], k: 0.6 }, { x: [8, 1.2], k: 0.25 }],
          rich: [{ x: [5, 5], k: 1 }, { x: [2.2, 6.4], k: 2.4 }, { x: [7.4, 2.0], k: 0.45 }, { x: [3.4, 3.2], k: 1.4 }, { x: [1.6, 2.4], k: 0.8 }],
          none: [{ x: [2, 9], k: 3 }, { x: [5.5, 5.5], k: 1 }, { x: [9, 2], k: 0.33 }],
        };
        let sel = 0, ed = null;
        v.select('record', [{ value: 'chain', label: 'a chain' }, { value: 'rich', label: 'five observations' }, { value: 'none', label: 'nothing ranked' }], 'chain', { onChange: (k) => { ed.load(PRE[k]); sel = 0; } });
        v.button('add an observation', () => { ed.setCount(ed.count + 1); sel = ed.count - 1; });
        v.button('remove the last', () => { ed.setCount(ed.count - 1); sel = Math.min(sel, ed.count - 1); });
        const s = v.stage({ x: [0, 12], y: [0, 12], equal: true, height: 410, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.3 });
        const tS = v.stage({ x: [0, 1], y: [0, 1], height: 410, axes: false, weight: 0.85, minWidth: 250, title: 'cost $p^t\\cdot x^s$ of bundle $x^s$ at the prices of observation $t$' });
        ed = obsEditor(v, s, PRE.chain, { n: 5, colors: COLS, onTouch: (i) => { sel = i; } });
        const Z = s.handle(3.2, 2.2, { color: 'gold', r: 6, label: 'z', labelPos: 'se' });
        s.onClick((x, y) => { const L = ed.list(); let best = -1, bd = 1e9; L.forEach((o, i) => { const d = Math.hypot(s.X(o.x[0]) - s.X(x), s.Y(o.x[1]) - s.Y(y)); if (d < bd) { bd = d; best = i; } }); if (bd < 60) sel = best; });
        const tab = v.table(tS, { rows: 3, cols: 3, maxCell: 64, size: 13.5, rowLabels: (k) => `$p^{${k + 1}}$`, colLabels: (k) => `$x^{${k + 1}}$`, cornerLabel: '' });
        v.legend([['ink', 'arrow xᵗ → xˢ: xˢ was affordable when xᵗ was chosen'], ['muted', 'revealed only through a chain', { dash: true }], ['gold', 'test bundle z', { dot: true }]]);
        let st = {};
        v.render(() => {
          const L = ed.list(), T = L.length; sel = clamp(sel, 0, T - 1);
          const A = rpAnalyze(L);
          // revealed-worse set of the selected observation: union of budget sets
          const worse = [sel, ...L.map((_, j) => j).filter((j) => A.Rs[sel][j] && j !== sel)];
          const mm = worse.map((t) => [L[t].p[0], L[t].p[1], costAt(L, t, t)]), c = v.rgb(COLS[sel]);
          s.raster((x, y) => (mm.some(([a, b, m]) => a * x + b * y <= m) ? [c[0], c[1], c[2], 58] : null), { key: JSON.stringify(mm) + c, res: 2 });
          L.forEach((o, t) => drawObs(s, o, COLS[t], { fillAlpha: 0.04, width: t === sel ? 2.8 : 1.8 }));
          // arrows of the revealed relation
          for (let t = 0; t < T; t++) for (let j = 0; j < T; j++) {
            if (t === j) continue;
            const both = A.R[t][j] && A.R[j][t];
            if (A.R[t][j]) trimArrow(s, L[t].x, L[j].x, { color: both ? 'red' : COLS[t], width: 2.4, head: 10 }, 12, 13);
            else if (A.Rs[t][j]) trimArrow(s, L[t].x, L[j].x, { color: 'muted', width: 1.8, head: 9, dash: [6, 5] }, 12, 13);
          }
          // the test bundle
          const z = [Z.x, Z.y];
          const direct = L.map((o, t) => o.p[0] * z[0] + o.p[1] * z[1] <= costAt(L, t, t) + 1e-9);
          const indirect = L.map((_, t) => !direct[t] && L.some((o, j) => A.Rs[t][j] && direct[j]));
          tab.draw({
            rows: T, cols: T,
            value: (i, j) => v.fix(costAt(L, i, j), 2),
            fill: (i, j) => (i === j ? [COLS[i], 0.3] : costAt(L, i, j) <= costAt(L, i, i) + 1e-9 ? ['green', 0.26] : null),
            textColor: (i, j) => (i !== j && A.R[i][j] && A.R[j][i] ? 'red' : 'ink'),
            weight: (i, j) => (i === j ? 700 : 500),
            sub: (i, j) => (i !== j && A.Rs[i][j] && !A.R[i][j] ? 'R*' : null), subColor: 'muted',
            rowLabelColor: (i) => COLS[i], colLabelColor: (j) => COLS[j],
            highlight: [[sel, sel, COLS[sel]]],
          });
          st = { L, T, A, sel, worse, direct, indirect, z };
        });
        v.readout(() => {
          const { L, T, A, sel, worse, direct, indirect } = st, X = (t) => `x^{${t + 1}}`;
          const dir = [], ind = [];
          for (let t = 0; t < T; t++) for (let j = 0; j < T; j++) if (t !== j) { if (A.R[t][j]) dir.push(`$${X(t)}\\,R\\,${X(j)}$`); else if (A.Rs[t][j]) ind.push(`$${X(t)}\\,R^*\\,${X(j)}$`); }
          const head = dir.length ? `Directly revealed: ${dir.join(', ')}.` : 'No bundle was affordable when another was chosen: the record ranks none of them.';
          const mid = ind.length ? ` Through chains: ${ind.join(', ')}.` : '';
          const shade = ` Shaded: everything revealed worse than $${X(sel)}$ (${worse.length === 1 ? 'its own budget set' : `the union of ${worse.length} budget sets`}).`;
          const d = direct.map((b, t) => (b ? t : -1)).filter((t) => t >= 0), i2 = indirect.map((b, t) => (b ? t : -1)).filter((t) => t >= 0);
          const zt = d.length || i2.length ? ` The test bundle $z$ is revealed worse than ${[...d.map((t) => `$${X(t)}$`), ...i2.map((t) => `$${X(t)}$ (through a chain)`)].join(', ')}.` : ' The test bundle $z$ lies outside every revealed-worse set: the record does not rank it.';
          const bad = A.warp.length ? ` Red: $${X(A.warp[0][0])}$ and $${X(A.warp[0][1])}$ each reveal the other worse, an inconsistency (6.5).` : '';
          return head + mid + shade + zt + bad;
        });
      },
    },
    // ------------------------------------------------------------------ 6.5
    {
      num: '6.5', kind: 'Principle', name: 'Weak axiom of revealed preference',
      statement: String.raw`Choices satisfy the **weak axiom of revealed preference** (WARP) if no two different chosen bundles are each directly revealed preferred to the other: whenever $x^t \ne x^s$ and $p^t\cdot x^s \le p^t\cdot x^t$, then $p^s\cdot x^t > p^s\cdot x^s$. In words: if $x^s$ was affordable when $x^t$ was chosen, then $x^t$ must not have been affordable when $x^s$ was chosen. Every consumer who maximizes a utility function with a *unique* best bundle on each budget (strictly convex preferences, for example) satisfies WARP. With weak preferences the right version is the weak generalized axiom: $x^t\,R\,x^s$ rules out $x^s\,P\,x^t$, which allows two bundles on each other's budget lines to be indifferent. WARP checks consistency only between pairs of observations; Afriat's theorem (6.6) handles chains.`,
      idea: String.raw`Suppose $u$ is maximized with a unique optimum on each budget. If $x^s$ was affordable when $x^t$ was chosen and $x^s \ne x^t$, then $u(x^t) > u(x^s)$. If $x^t$ had also been affordable when $x^s$ was chosen, the same reasoning would give $u(x^s) > u(x^t)$, a contradiction. Geometrically, an indifference curve that supports a budget line at the chosen bundle lies on or above that line. When each chosen bundle lies inside the other's budget set, the curve through $x^1$ passes above $x^2$ and the curve through $x^2$ passes above $x^1$, so the two curves would have to cross, which indifference curves cannot do (4.5). Samuelson proposed WARP as the whole empirical content of consumer theory. With only two goods it nearly is: for finite data a pairwise check already detects every inconsistency (Rose 1958; Banerjee and Murphy 2006), while with three or more goods longer cycles matter.`,
      caption: String.raw`Drag the two chosen bundles and turn their budget lines with the knobs. The ledger on the right compares, at each observation's prices, what was spent with what the other bundle would have cost. When only one of them was affordable at the other's prices the data are consistent, and the purple curves are indifference curves of a utility that explains both choices (built by Afriat's method, 6.6). Choose **violation**: each bundle lies inside the other's budget set (red hatching), and any indifference curves supporting the two choices would have to cross, as the two dashed curves do.`,
      deps: ['micro-6.4'], refs: ['Varian Ch. 7'], tags: ['revealed preference'],
      see: ['micro-4.5', 'micro-6.12'],
      credit: 'Paul Samuelson, 1938',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Weak_axiom_of_revealed_preference' },
      viz(v) {
        const COLS = ['blue', 'orange'];
        const PRE = {
          ok: [{ x: [3, 7], k: 1.8 }, { x: [7.5, 3], k: 0.55 }],
          one: [{ x: [3.5, 6.5], k: 1.2 }, { x: [6.5, 2.5], k: 0.5 }],
          bad: [{ x: [2.6, 6.2], k: 0.5 }, { x: [6.2, 3.4], k: 1.6 }],
        };
        let ed = null;
        v.select('start from', [{ value: 'ok', label: 'unranked' }, { value: 'one', label: 'one-way' }, { value: 'bad', label: 'violation' }], 'one', { onChange: (k) => ed.load(PRE[k]) });
        const s = v.stage({ x: [0, 12], y: [0, 12], equal: true, height: 410, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.3 });
        const g = v.stage({ x: [0, 1], y: [0, 1], height: 410, axes: false, weight: 0.8, minWidth: 250, title: 'the ledger: spent vs. what the other bundle cost' });
        ed = obsEditor(v, s, PRE.one, { n: 2, colors: COLS });
        v.legend([['blue', 'observation 1'], ['orange', 'observation 2'], ['purple', 'indifference curves that rationalize both'], ['red', 'both affordable in both budgets', { area: true }]]);
        let st = {};
        v.render(() => {
          const L = ed.list(), A = rpAnalyze(L), R12 = A.R[0][1], R21 = A.R[1][0], bad = A.warp.length > 0 || A.viol.length > 0;
          L.forEach((o, t) => drawObs(s, o, COLS[t], { fillAlpha: 0.07, width: 2.6 }));
          if (bad) { const inter = clipHalf(triOf(L[0]), L[1].p, costAt(L, 1, 1)); if (inter.length > 2) s.clip(() => s.poly(inter, { fill: 'red', fillAlpha: 0.08, hatch: 'red', hatchAlpha: 0.5, color: 'red', width: 1 })); }
          if (R12) trimArrow(s, L[0].x, L[1].x, { color: bad ? 'red' : COLS[0], width: 2.6, head: 10 }, 12, 13);
          if (R21) trimArrow(s, L[1].x, L[0].x, { color: bad ? 'red' : COLS[1], width: 2.6, head: 10 }, 12, 13);
          let cross = null;
          if (!bad) {
            const sol = afriat(L, A), planes = afriatPlanes(L, sol);
            const lv = [...new Set(sol.u.map((u) => +u.toFixed(9)))];
            for (const c of lv) for (const [P, Q] of plLevel(planes, c, 12, 12)) s.line(P[0], P[1], Q[0], Q[1], { color: 'purple', width: 2.4 });
            st.sol = sol;
          } else {
            // Cobb–Douglas curves tangent to each budget at its chosen bundle: they must cross
            const cd = L.map((o) => { const a = (o.p[0] * o.x[0]) / (o.p[0] * o.x[0] + o.p[1] * o.x[1]), c = o.x[0] ** a * o.x[1] ** (1 - a); return (x) => (c / x ** a) ** (1 / (1 - a)); });
            cd.forEach((f, t) => s.clip(() => s.fn(f, { domain: [0.2, 12], color: COLS[t], width: 2, dash: [7, 5], n: 240 })));
            const lo = Math.min(L[0].x[0], L[1].x[0]), hi = Math.max(L[0].x[0], L[1].x[0]);
            const xc = (() => { const f = (x) => cd[0](x) - cd[1](x); let a = lo, b = hi; if (f(a) * f(b) > 0) return null; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (f(a) * f(m) <= 0) b = m; else a = m; } return (a + b) / 2; })();
            if (xc != null) { cross = [xc, cd[0](xc)]; s.dot(cross[0], cross[1], { r: 9, hollow: true, color: 'red', width: 2.6 }); s.text('curves would cross', cross[0], cross[1], { dx: 14, dy: -14, color: 'red', ...LBL, align: 'left', plate: true }); }
          }
          // the ledger
          const own = [costAt(L, 0, 0), costAt(L, 1, 1)], oth = [costAt(L, 0, 1), costAt(L, 1, 0)], top = Math.max(...own, ...oth) * 1.12;
          g.setView([-0.04 * top, top], [0, 1]);
          [[0, 0.72], [1, 0.27]].forEach(([t, y]) => {
            const o = 1 - t, aff = oth[t] <= own[t] + 1e-9, col = aff ? (bad ? 'red' : 'green') : 'muted';
            g.text(`at prices p${SUPS(t)}`, 0, y + 0.17, { color: COLS[t], ...LBL, size: 12.5, align: 'left' });
            g.rect(0, y + 0.02, own[t], y + 0.1, { fill: COLS[t], fillAlpha: 0.75, stroke: false, radius: 3 });
            g.text(`x${SUPS(t)} cost ${v.fix(own[t], 2)} (spent)`, own[t], y + 0.06, { dx: 6, color: 'ink', size: 11.5, weight: 600, align: own[t] > 0.6 * top ? 'right' : 'left', ...(own[t] > 0.6 * top ? { dx: -6, color: 'panel' } : {}) });
            g.rect(0, y - 0.1, oth[t], y - 0.02, { fill: col, fillAlpha: 0.25, color: col, width: 1.6, radius: 3 });
            g.text(`x${SUPS(o)} would cost ${v.fix(oth[t], 2)}`, oth[t], y - 0.06, { dx: 6, color: 'ink', size: 11.5, weight: 600, align: oth[t] > 0.6 * top ? 'right' : 'left', ...(oth[t] > 0.6 * top ? { dx: -6 } : {}) });
            g.text(aff ? `affordable: x${SUPS(t)} R x${SUPS(o)}` : `not affordable: no ranking`, 0, y - 0.15, { color: aff ? (bad ? 'red' : 'green') : 'muted', size: 11.5, weight: 700, align: 'left' });
          });
          st = { ...st, L, A, R12, R21, bad, own, oth, cross };
        });
        v.readout(() => {
          const { R12, R21, bad, own, oth } = st, f = (q) => v.fix(q, 2);
          if (bad) return `**WARP fails.** At prices $p^1$ the bundle $x^2$ cost ${f(oth[0])} $\\le$ ${f(own[0])}, so $x^1$ was chosen over it; at prices $p^2$ the bundle $x^1$ cost ${f(oth[1])} $\\le$ ${f(own[1])}, so $x^2$ was chosen over $x^1$. No utility function with a unique optimum can produce both choices: the curve through $x^1$ must pass above $x^2$ and the curve through $x^2$ above $x^1$, so they would cross.`;
          if (R12 || R21) { const [a, b] = R12 ? [1, 2] : [2, 1]; return `Consistent: $x^${b}$ was affordable when $x^${a}$ was chosen (it cost ${f(R12 ? oth[0] : oth[1])} against ${f(R12 ? own[0] : own[1])}), so $x^${a}\\,R\\,x^${b}$; but $x^${a}$ was not affordable when $x^${b}$ was chosen. The purple curves come from Afriat's construction, $U(x) = \\min_t\\, u_t + \\lambda_t\\,p^t\\cdot(x - x^t)$ with $u_1 = ${f(st.sol.u[0])}$, $u_2 = ${f(st.sol.u[1])}$: each curve lies on or above its budget line and they do not cross.`; }
          return `Consistent and uninformative: neither bundle was affordable when the other was chosen (${f(oth[0])} > ${f(own[0])} and ${f(oth[1])} > ${f(own[1])}). One indifference curve can pass through both bundles, as Afriat's construction (purple) shows: the data cannot tell which is better.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.6
    {
      num: '6.6', kind: 'Theorem', name: 'Afriat’s theorem (GARP)',
      statement: String.raw`For a finite record $(p^t, x^t)_{t=1}^T$ with positive prices the following are equivalent:
(a) the record can be rationalized by a locally non-satiated preference: each $x^t$ is at least as good as every bundle affordable at $p^t$;
(b) the record satisfies the **generalized axiom of revealed preference** (GARP): if $x^t\,R^*\,x^s$ then not $x^s\,P\,x^t$, that is, there is no cycle of revealed preferences with at least one strict link;
(c) there are numbers $u_t$ and $\lambda_t > 0$ satisfying **Afriat's inequalities** $u_s \le u_t + \lambda_t\,p^t\cdot(x^s - x^t)$ for all $s, t$;
(d) the record can be rationalized by a continuous, concave, strictly increasing utility, for example $U(x) = \min_t\,\big(u_t + \lambda_t\,p^t\cdot(x - x^t)\big)$.
So beyond GARP, a finite record has no testable implications of utility maximization: not even convexity or continuity of preferences can be refuted. Afriat's critical cost efficiency index, the largest $e \le 1$ for which the record passes GARP when every budget is shrunk to $e\,p^t\cdot x^t$, measures how close a violating record is to being rational.`,
      idea: String.raw`(d) ⇒ (a) is immediate and (a) ⇒ (b) is the chain argument of 6.4: around a cycle the utilities would have to satisfy $u(x^t) \ge \dots \ge u(x^s) > u(x^t)$. The heart is (b) ⇒ (c). Rank the observations by the longest chain of strict revealed preferences above them, then define the $u_t$ and $\lambda_t$ rank by rank. Each $u_t$ is the largest number allowed by the inequalities of the observations already ranked above, and each $\lambda_t$ is large enough for its supporting plane to pass above everything ranked above it. GARP is used exactly once, to make observations of the same rank compatible. Then (c) ⇒ (d): $U$ is a minimum of increasing affine functions, so it is concave and increasing, $U(x^t) = u_t$, and on the budget $p^t\cdot y \le p^t\cdot x^t$ we get $U(y) \le u_t + \lambda_t\,p^t\cdot(y - x^t) \le u_t$. Checking (b) is fast: Warshall's transitive closure takes $O(T^3)$ steps.`,
      caption: String.raw`Up to six observations: drag the chosen bundles, turn the budget lines with the knobs, add or remove observations, or generate a record from a Cobb–Douglas shopper whose choices carry a slider-controlled amount of **noise**. While GARP holds, the purple lines are the indifference curves of Afriat's utility through each chosen bundle: polygons that touch every budget line at its choice and stay above it. The table gives the numbers $u_t, \lambda_t$. When GARP fails, a shortest cycle is drawn in red and the dashed lines show every budget shrunk by Afriat's efficiency index, the smallest shrinkage that removes all violations.`,
      deps: ['micro-6.5'], refs: ['Varian Ch. 7', 'Varian, Econometrica 50(4), 1982'], tags: ['revealed preference'],
      see: ['opt-4.4', 'algo-9.13', 'micro-4.6'],
      credit: 'Sidney Afriat, 1967; Hal Varian, 1982',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Afriat%27s_theorem' },
      viz(v) {
        const COLS = OBS_COLS;
        const PRE = {
          cd: [{ x: [2.4, 7.2], k: 2.2 }, { x: [4.6, 4.0], k: 1 }, { x: [7.6, 2.6], k: 0.45 }, { x: [3.2, 3.4], k: 1.25 }],
          bad: [{ x: [2.4, 7.2], k: 2.2 }, { x: [4.6, 4.0], k: 1 }, { x: [7.6, 2.6], k: 0.45 }, { x: [5.6, 4.4], k: 2.6 }],
        };
        let seed = 3, ed = null;
        const gen = (sd, noise) => {
          const r = v.rng(sd), out = [];
          for (let t = 0; t < 6; t++) { const k = Math.exp(r.uniform(-0.6, 0.6)), m = r.uniform(4.5, 8.5), s1 = clamp(0.5 + noise * r.uniform(-0.3, 0.3), 0.2, 0.8); out.push({ x: [(s1 * m) / k, (1 - s1) * m], k }); }
          return out;
        };
        const src = v.select('record', [{ value: 'cd', label: 'four consistent choices' }, { value: 'bad', label: 'with a violation' }, { value: 'gen', label: 'noisy shopper' }], 'cd', { onChange: (k) => { noise.el.hidden = k !== 'gen'; again.hidden = k !== 'gen'; ed.load(k === 'gen' ? gen(seed, noise.value) : PRE[k]); } });
        const noise = v.slider('noise in the shares spent', 0, 1, 0.5, { step: 0.01, onChange: () => ed.load(gen(seed, noise.value)) });
        const again = v.button('new data', () => { seed++; ed.load(gen(seed, noise.value)); });
        v.button('add an observation', () => ed.setCount(ed.count + 1));
        v.button('remove the last', () => ed.setCount(ed.count - 1));
        noise.el.hidden = true; again.hidden = true;
        const s = v.stage({ x: [0, 12], y: [0, 12], equal: true, height: 420, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.35 });
        const tS = v.stage({ x: [0, 1], y: [0, 1], height: 420, axes: false, weight: 0.75, minWidth: 230, title: 'Afriat numbers' });
        ed = obsEditor(v, s, PRE.cd, { n: 6, colors: COLS });
        const tabU = v.table(tS, { rows: 4, cols: 2, square: false, cellAspect: 1.5, maxCell: 54, size: 13.5, colLabels: ['$u_t$', '$\\lambda_t$'], rowLabels: (k) => `$t = ${k + 1}$` });
        const tabC = v.table(tS, { rows: 4, cols: 4, maxCell: 54, size: 12.5, rowLabels: (k) => `$p^{${k + 1}}$`, colLabels: (k) => `$x^{${k + 1}}$` });
        let st = {};
        v.render(() => {
          const L = ed.list(), T = L.length, A = rpAnalyze(L), ok = A.garp;
          L.forEach((o, t) => drawObs(s, o, COLS[t], { fillAlpha: 0.035, width: 2 }));
          let sol = null, slack = null, e = 1;
          if (ok) {
            sol = afriat(L, A); slack = afriatSlack(L, sol);
            const planes = afriatPlanes(L, sol), lv = [...new Set(sol.u.map((u) => +u.toFixed(9)))].sort((a, b) => a - b);
            const span = Math.max(1, lv[lv.length - 1] - lv[0]);
            for (const c of [lv[0] - 0.6 * span, lv[lv.length - 1] + 0.6 * span]) for (const [P, Q] of plLevel(planes, c, 12, 12)) s.line(P[0], P[1], Q[0], Q[1], { color: 'purple', width: 1, alpha: 0.35 });
            for (const c of lv) for (const [P, Q] of plLevel(planes, c, 12, 12)) s.line(P[0], P[1], Q[0], Q[1], { color: 'purple', width: 2.4 });
            tS.setTitle('Afriat numbers: $U(x) = \\min_t\\, u_t + \\lambda_t\\,p^t\\cdot(x - x^t)$');
            tabU.draw({ rows: T, value: (i, j) => v.fix(j ? sol.lam[i] : sol.u[i], 2), rowLabelColor: (i) => COLS[i], fill: (i) => [COLS[i], 0.12] });
          } else {
            e = ccei(L);
            L.forEach((o, t) => { const m = e * costAt(L, t, t); s.clip(() => s.line(m / o.p[0], 0, 0, m / o.p[1], { color: COLS[t], width: 1.6, dash: [5, 4], alpha: 0.8 })); });
            const cyc = A.cycle || [];
            for (let i = 0; i < cyc.length; i++) { const a = cyc[i], b = cyc[(i + 1) % cyc.length]; trimArrow(s, L[a].x, L[b].x, { color: 'red', width: 3, head: 11 }, 12, 13); }
            tS.setTitle('costs $p^t\\cdot x^s$; red: a violating pair');
            const inV = (i, j) => A.viol.some(([a, b]) => (a === i && b === j) || (a === j && b === i));
            tabC.draw({ rows: T, cols: T, value: (i, j) => v.fix(costAt(L, i, j), 1), fill: (i, j) => (i === j ? [COLS[i], 0.3] : inV(i, j) && costAt(L, i, j) <= costAt(L, i, i) + 1e-9 ? ['red', 0.3] : costAt(L, i, j) <= costAt(L, i, i) + 1e-9 ? ['green', 0.2] : null), rowLabelColor: (i) => COLS[i], colLabelColor: (j) => COLS[j] });
          }
          st = { L, T, A, ok, sol, slack, e };
        });
        v.readout(() => {
          const { T, A, ok, slack, e } = st, X = (t) => `x^{${t + 1}}`;
          if (ok) return `**GARP holds** for these ${T} observations, so Afriat's inequalities have a solution: the recursion of the proof gives the table, and all ${T * (T - 1)} inequalities $u_s \\le u_t + \\lambda_t\\,p^t\\cdot(x^s - x^t)$ hold (smallest slack ${v.fix(Math.max(slack, 0), 3)}). The concave utility $U$ drawn in purple rationalizes every choice.`;
          const c = A.cycle || [], cyc = c.map((t) => `$${X(t)}$`).join(' → ');
          return `**GARP fails**: ${cyc} → $${X(c[0])}$ is a cycle of revealed preferences with a strict link, so no locally non-satiated preference explains this record. ${c.length === 2 ? 'With two goods every violation already shows up in a pair of observations (Rose 1958). ' : ''}Afriat's efficiency index is $e^* = ${v.fix(e, 3)}$: shrinking every budget by ${v.fix(100 * (1 - e), 1)}% (dashed lines) removes all ${A.viol.length} violating pair${A.viol.length === 1 ? '' : 's'}, so the shopper wastes at most that share of spending relative to some consistent consumer.`;
        });
      },
    },
  ],
};
