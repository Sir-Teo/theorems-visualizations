// Microeconomics — Chapter 6: Income and substitution effects, revealed preference and welfare (items 6.1–6.6; 6.7–6.13 in ch06-b.js)
import { clamp, GUIDE, LBL, SUP, sgn, showStage, prefs, demand, hicks, slutsky, drawLevel, trimArrow, budget, bline } from './ch06.shared.js';

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
          inf: { label: 'inferior good 1', F: prefs('inf', { A: 6, k: 6 }) },
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
          if (Math.abs(y1 - y0) * (s.height / 13) > 14 && Math.max(y0, y1) < 12.9) { s.measure(0.35, y0, 0.35, y1, null, { color: 'orange' }); s.text(`Δm = ${sgn(mc - M)}`, 0.5, (y0 + y1) / 2, { dx: 6, color: 'orange', ...LBL, align: 'left' }); }
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
          const comp = k === 'slutsky' ? ` Slutsky compensation $x_1^A\\,\\Delta p_1 = ${f(sl - 10)}$ makes $A$ affordable again; Hicks compensation, just enough to reach $A$'s curve, would be ${f(hk - 10)}${Math.abs(P - 1) > 0.05 && kf !== 'comp' ? ', a little less, because at $B$ the consumer is better off than at $A$' : ''}.` : ` Hicks compensation $e(p', u_A) - m = ${f(mc - 10)}$ keeps the consumer on $A$'s curve; Slutsky's rule would give ${f(sl - 10)}.`;
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
          inf: { label: 'inferior good 1', F: prefs('inf', { A: 6, k: 6 }) },
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
        const L = v.stage({ x: [0, 10], y: [0, 3.6], height: 330, axes: 'box', xlabel: 'x₁', ylabel: 'price p₁', title: 'demand curves through $A$' });
        const R = v.stage({ x: [0.001, 1], y: [-5, 1], height: 330, axes: 'box', xlog: true, xlabel: 'price step Δp₁ (log scale)', ylabel: 'slope', title: 'finite-difference slopes converge' });
        const B = v.stage({ x: [-5, 2], y: [0, 3], height: 120, axes: false, full: true, title: 'the decomposition at this step (filled) and in the limit (outlined)' });
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
            R.setView([0.001, 1], [lo - pd, hi + pd]);
            R.hline(0, { color: 'faint', width: 1 });
            [[sl.dx, 'green'], [sl.dh, 'orange'], [sl.inc, 'teal']].forEach(([y, c]) => R.hline(y, { color: c, width: 1.3, dash: [6, 4], alpha: 0.8 }));
            [[0, 'green'], [1, 'orange'], [2, 'teal']].forEach(([j, c]) => R.path(hs.map((h, i) => [h, rr[i][j]]), { color: c, width: 2.6 }));
            R.vline(D, GUIDE);
            R.dot(D, Tt, { r: 5, color: 'green' }); R.dot(D, Ss, { r: 5, color: 'orange' }); R.dot(D, Ii, { r: 5, color: 'teal' });
            const lbl = [[sl.dx, 'green', '∂x₁/∂p₁'], [sl.dh, 'orange', '∂h₁/∂p₁'], [sl.inc, 'teal', '−x₁ ∂x₁/∂m']].sort((a, b) => b[0] - a[0]);
            let lastY = -1e9; lbl.forEach(([y, c, t]) => { let Y = R.Y(y) - 9; if (Y - lastY < 15) Y = lastY + 15; lastY = Y; R.textPx(t, 62, Y, { color: c, size: 11.5, weight: 700, align: 'left' }); });
            // bars
            const W = Math.max(1, Math.abs(Ss), Math.abs(Ii), Math.abs(Tt), Math.abs(sl.dh), Math.abs(sl.inc), Math.abs(sl.dx)) * 1.15;
            B.setView([-W * 1.25, W * 1.25], [0, 3]);
            B.line(0, 0.2, 0, 2.9, { color: 'ink', width: 1.2 });
            // stacked: substitution then income, on the top row; total on the bottom row
            const bar = (x0, x1, y, col, outline) => B.rect(x0, y - 0.3, x1, y + 0.3, outline ? { color: col, width: 2, fill: col, fillAlpha: 0.05, radius: 3 } : { fill: col, fillAlpha: 0.7, stroke: false, radius: 3 });
            bar(0, sl.dh, 2.15, 'orange', true); bar(sl.dh, sl.dh + sl.inc, 2.15, 'teal', true); bar(0, sl.dx, 0.85, 'green', true);
            bar(0, Ss, 2.15, 'orange'); bar(Ss, Ss + Ii, 2.15, 'teal'); bar(0, Tt, 0.85, 'green');
            B.text(`substitution ${sgn(Ss, 3)}  +  income ${sgn(Ii, 3)}`, -W * 1.22, 2.15, { color: 'ink', ...LBL, align: 'left' });
            B.text(`=  total ${sgn(Tt, 3)}`, -W * 1.22, 0.85, { color: 'green', ...LBL, align: 'left' });
            st = { one, k, P, D, sl, Tt, Ss, Ii };
          } else {
            const key = sys.value, p = [q1.value, q2.value, 1], m = M, h = 1e-5, x = sysDemand(key, p, m);
            const dm = sysDemand(key, p, m + h).map((z, i) => (z - sysDemand(key, p, m - h)[i]) / (2 * h));
            const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
            for (let j = 0; j < 3; j++) { const pp = p.slice(), pm = p.slice(); pp[j] += h; pm[j] -= h; const a = sysDemand(key, pp, m), b = sysDemand(key, pm, m); for (let i = 0; i < 3; i++) S[i][j] = (a[i] - b[i]) / (2 * h) + x[j] * dm[i]; }
            const Sp = S.map((r) => r[0] * p[0] + r[1] * p[1] + r[2] * p[2]);
            const big = Math.max(...S.flat().map(Math.abs)) || 1;
            let asym = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) asym = Math.max(asym, Math.abs(S[i][j] - S[j][i]));
            const sym = S.map((r, i) => r.map((z, j) => (z + S[j][i]) / 2)), ev = v.M.eigSym(sym).values;
            tab.draw({
              value: (i, j) => (j < 3 ? v.fix(S[i][j], 3) : v.fix(Sp[i], 4)),
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
            st = { one, key, p, S, Sp, asym, ev, qhi, qlo, big };
          }
        });
        v.readout(() => {
          const S = st, f3 = (q) => v.fix(q, 3);
          if (S.one) {
            const err = S.sl.dx - S.sl.dh - S.sl.inc;
            return `At $p_1 = ${v.fix(S.P, 2)}$: $\\partial x_1/\\partial p_1 = ${f3(S.sl.dx)}$, $\\partial h_1/\\partial p_1 = ${f3(S.sl.dh)}$ and $-x_1\\,\\partial x_1/\\partial m = ${v.fix(-S.sl.x[0], 3)} \\times ${f3(S.sl.dm)} = ${f3(S.sl.inc)}$, each computed separately by finite differences. Their sum is ${f3(S.sl.dh + S.sl.inc)}, and the Slutsky identity holds to $${v.sci(Math.abs(err) + 1e-16, 1)}$. With the finite step $\\Delta p_1 = ${v.fix(S.D, S.D < 0.01 ? 4 : 3)}$ the slopes are ${f3(S.Ss)} + ${f3(S.Ii)} = ${f3(S.Tt)}: off by ${v.fix(Math.abs(S.Tt - S.sl.dx), 4)}, an error proportional to the step.`;
          }
          const evs = S.ev.map((z) => v.fix(Math.abs(z) < 5e-6 ? 0 : z, 3)).join(', ');
          const symTxt = S.asym < 1e-5 * S.big ? 'symmetric (largest $|S_{ij} - S_{ji}|$ is $< 10^{-5}$)' : `**not symmetric**: $|S_{ij} - S_{ji}|$ reaches ${f3(S.asym)} (red entries), so no utility function generates this demand, although it is homogeneous and spends exactly $m$`;
          const nsd = S.qhi > 1e-6 * S.big ? `**not negative semidefinite**: $z^\\top S z$ reaches ${f3(S.qhi)} > 0, so for some compensated price change demand moves *with* prices` : `negative semidefinite: $z^\\top S z \\le 0$ in every direction (largest ${v.fix(S.qhi, 4)})`;
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
          if (C > 0.05) { s.clip(() => s.poly([[0, 0], [C, 0], [0, C]], { fill: 'red', fillAlpha: 0.06, stroke: false })); s.clip(() => s.line(C, 0, 0, C, { color: 'red', width: 1.8, dash: [6, 4] })); if (C > 2) s.text('calorie need', C * 0.16, C * 0.84, { dx: 8, color: 'red', ...LBL, align: 'left' }); }
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
          const xmax = Math.max(...xs); d.setView([0, Math.max(9, xmax * 1.08)], [0.2, 0.95]);
          d.path(ps.map((q, i) => [xs[i], q]), { color: 'accent', width: 2.6 });
          let up = 0;
          for (let i = 1; i < ps.length; i++) if (xs[i] > xs[i - 1] + 1e-9) { d.line(xs[i - 1], ps[i - 1], xs[i], ps[i], { color: 'gold', width: 6, alpha: 0.85 }); up++; }
          d.path(ps.map((q, i) => [xs[i], q]), { color: 'accent', width: 1.6 });
          d.hline(P, { color: 'muted', width: 1, dash: [3, 3] }); d.hline(P1, { color: 'muted', width: 1, dash: [3, 3] });
          d.dot(A[0], P, { r: 6, color: 'ink', label: 'A', labelPos: 'nw' }); d.dot(C1[0], P1, { r: 6.5, color: 'green', label: 'C', labelPos: 'nw' });
          const giff = C1[0] > A[0] + 1e-6 === P1 > P;
          if (up) { const j = xs.findIndex((z, i) => i > 0 && z > xs[i - 1]); const jj = xs.findLastIndex((z, i) => i > 0 && z > xs[i - 1]); const mid = Math.round((j + jj) / 2); d.text('Giffen range', xs[mid], ps[mid], { dx: -10, color: 'gold', ...LBL, align: 'right' }); }
          // elasticity across incomes, at the price before
          const ms = []; for (let i = 0; i <= 80; i++) ms.push(2 + (10 * i) / 80);
          const h = 1e-4, el = ms.map((q) => { const a = demand(F, P + h, p2, q)[0], b = demand(F, P - h, p2, q)[0], x0 = demand(F, P, p2, q)[0]; return x0 > 1e-9 ? ((a - b) / (2 * h)) * (P / x0) : NaN; });
          const emax = Math.max(1, ...el.filter(isFinite)), emin = Math.min(-1.5, ...el.filter(isFinite));
          e.setView([2, 12], [Math.max(emin, -6) * 1.1, emax * 1.15]);
          e.between((q) => { const i = clamp(Math.round(((q - 2) / 10) * 80), 0, 80); return Math.max(0, el[i] || 0); }, () => 0, 2, 12, { fill: 'gold', fillAlpha: 0.3, n: 160 });
          e.hline(0, { color: 'ink', width: 1.2 });
          e.clip(() => e.path(ms.map((q, i) => [q, el[i]]), { color: 'accent', width: 2.6 }));
          const iM = clamp(Math.round(((M - 2) / 10) * 80), 0, 80); e.vline(M, GUIDE); if (isFinite(el[iM])) e.dot(M, el[iM], { r: 5.5, color: 'ink' });
          const sl = slutsky(F, P, p2, M);
          st = { C, M, P, P1, A, Bx, C1, sl, giff, cal: A[0] + A[1], up };
        });
        v.readout(() => {
          const { C, M, P, P1, A, Bx, C1, sl, cal } = st, f = (q) => v.fix(q, 2);
          const regime = A[1] < 1e-6 ? `This household is so poor that it eats only rice (${f(A[0])} units, ${f(cal)} calories against a need of ${f(C)}); a dearer staple forces it to buy less, the ordinary way.` : C > 0.05 && cal < C + 2 ? `It eats ${f(A[0])} rice and ${f(A[1])} meat, close to its calorie need of ${f(C)}: the subsistence zone.` : `With ${f(cal)} calories it is well above its need of ${f(C)}, so rice behaves like an ordinary good.`;
          const g = sl.dx > 0;
          const verdict = g ? `**Giffen**: the income effect ${sgn(sl.inc)} outweighs the substitution effect ${sgn(sl.dh)} (${v.fix(Math.abs(sl.inc / sl.dh), 1)} times larger), so $\\partial x_1/\\partial p_1 = ${sgn(sl.dx)} > 0$.` : `Not Giffen here: substitution effect ${sgn(sl.dh)}, income effect ${sgn(sl.inc)}, total $\\partial x_1/\\partial p_1 = ${sgn(sl.dx)}$.`;
          return `${regime} Slutsky terms at $p_1 = ${f(P)}$: ${verdict} For the price change to ${f(P1)}: substitution ${sgn(Bx[0] - A[0])}, income ${sgn(C1[0] - Bx[0])}, total ${sgn(C1[0] - A[0])} units of rice.`;
        });
      },
    },
  ],
};
