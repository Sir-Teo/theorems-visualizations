// Microeconomics — Chapter 4: Preferences, utility and the budget constraint (items 4.1–4.6; 4.7–4.12 in ch04-b.js)
import { clamp, bisect, prefs, onRay, drawLevel, shadeSets, bestOnPath, placeLabel } from './ch04.shared.js';

const GUIDE = { color: 'muted', width: 1, dash: [3, 3] };
/** Arrow between two bundles, trimmed in pixels so it clears the dots. */
function trimArrow(s, a, b, st, t0 = 11, t1 = 13) {
  const X1 = s.X(a[0]), Y1 = s.Y(a[1]), X2 = s.X(b[0]), Y2 = s.Y(b[1]), L = Math.hypot(X2 - X1, Y2 - Y1);
  if (L < t0 + t1 + 4) return;
  const ux = (X2 - X1) / L, uy = (Y2 - Y1) / L, [x1, y1] = s.inv(X1 + ux * t0, Y1 + uy * t0), [x2, y2] = s.inv(X2 - ux * t1, Y2 - uy * t1);
  s.arrow(x1, y1, x2, y2, st);
}
/** Text beside the midpoint of segment p–q, pushed `off` pixels along the normal that points away from `away`. */
function segLabel(s, p, q, text, away, st = {}, off = 14) {
  const X1 = s.X(p[0]), Y1 = s.Y(p[1]), X2 = s.X(q[0]), Y2 = s.Y(q[1]), L = Math.hypot(X2 - X1, Y2 - Y1) || 1;
  let nx = -(Y2 - Y1) / L, ny = (X2 - X1) / L;
  const mx = (X1 + X2) / 2, my = (Y1 + Y2) / 2;
  if ((s.X(away[0]) - mx) * nx + (s.Y(away[1]) - my) * ny > 0) { nx = -nx; ny = -ny; }
  s.textPx(text, mx + nx * off, my + ny * off, { align: Math.abs(nx) < 0.3 ? 'center' : nx > 0 ? 'left' : 'right', baseline: 'middle', size: 11.5, ...st });
}

export default {
  collection: 'micro',
  chapter: 4,
  title: 'Preferences, utility and the budget constraint',
  summary: String.raw`The consumer's problem has two halves: what can be afforded and what is wanted. The budget set describes the first, a triangle cut out by prices and income that taxes, vouchers and rations bend into other shapes. Preferences describe the second: a complete and transitive ranking of bundles, drawn as a map of indifference curves that cannot cross. When preferences are also continuous they can be represented by an ordinal utility function, whose numbers mean nothing beyond their order. The slope of an indifference curve, the marginal rate of substitution, equals the ratio of marginal utilities and is the quantity the rest of consumer theory works with.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Definition', name: 'Budget set and budget line',
      statement: String.raw`A consumer with income $m > 0$ who faces prices $p_1, p_2 > 0$ for two goods can afford exactly the bundles in the **budget set**
$$B(p_1, p_2, m) = \{(x_1, x_2) : x_1 \ge 0,\ x_2 \ge 0,\ p_1x_1 + p_2x_2 \le m\}.$$
Its outer edge, where $p_1x_1 + p_2x_2 = m$ and all income is spent, is the **budget line**. It meets the axes at $m/p_1$ and $m/p_2$ and has slope $-p_1/p_2$, the market's rate of exchange: one more unit of good 1 costs $p_1/p_2$ units of good 2. Raising $m$ shifts the line outward parallel to itself; raising $p_1$ pivots it inward about the intercept $m/p_2$; multiplying $p_1$, $p_2$ and $m$ by the same $t > 0$ leaves the set unchanged. With $n$ goods the budget line is the hyperplane $p \cdot x = m$.`,
      idea: String.raw`Spending is linear in the quantities, so the bundles that exhaust income form a straight line. Its intercepts are what income buys of one good alone. Walking along it moves $p_1$ dollars from good 2 to good 1 for every unit of good 1, which buys $p_1/p_2$ fewer units of good 2. That slope is an opportunity cost (1.2) set by market prices, the consumer's counterpart of the slope of the production possibility frontier (1.4). Only the ratios $p_1/m$ and $p_2/m$ enter the inequality, which is why proportional changes in all prices and income change nothing, and why one good can serve as the numéraire with price 1.`,
      caption: String.raw`Move the income and price sliders and compare with the dashed pinned line (**pin this line** fixes the current one): income shifts the line in parallel, and each price pivots it about the other intercept. The step triangle reads the slope as a rate of exchange. Drag the bundle $A$: the bar below splits its cost into spending on each good and compares it with income.`,
      deps: ['micro-1.2'], refs: ['Varian Ch. 2', 'Mankiw Ch. 21'], tags: ['budget'],
      see: ['micro-1.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Budget_constraint' },
      viz(v) {
        const W = 42;
        const m = v.slider('income $m$', 20, 120, 72, { step: 1 });
        const p1 = v.slider('price $p_1$', 1, 12, 3, { step: 0.1 });
        const p2 = v.slider('price $p_2$', 1, 12, 2, { step: 0.1 });
        let ref = { m: 72, p1: 2.4, p2: 2 };
        v.button('pin this line', () => { ref = { m: m.value, p1: p1.value, p2: p2.value }; });
        const s = v.stage({ x: [0, W], y: [0, W], height: 360, axes: 'box', xlabel: 'x₁ (good 1)', ylabel: 'x₂ (good 2)', title: 'the budget set $p_1x_1 + p_2x_2 \\le m$' });
        const b = v.stage({ x: [-20, 130], y: [0, 1.5], height: 92, axes: false, full: true, title: 'what bundle $A$ costs, against income' });
        const A = s.handle(8, 12, { color: 'gold', label: 'A', constrain: (x, y) => [clamp(x, 0, W - 0.6), clamp(y, 0, W - 0.6)] });
        v.legend([['accent', 'budget line'], ['muted', 'pinned line', { dash: true }], ['orange', 'spending on good 1', { area: true }], ['teal', 'spending on good 2', { area: true }]]);
        const st = {};
        v.render(() => {
          const M = m.value, P1 = p1.value, P2 = p2.value, X1 = M / P1, X2 = M / P2, k = P1 / P2;
          const R1 = ref.m / ref.p1, R2 = ref.m / ref.p2, same = Math.abs(R1 - X1) < 1e-9 * X1 && Math.abs(R2 - X2) < 1e-9 * X2;
          s.poly([[0, 0], [X1, 0], [0, X2]], { fill: 'accent', fillAlpha: 0.13, stroke: false });
          s.text('affordable', Math.min(X1, W) * 0.2, Math.min(X2, W) * 0.22, { color: 'accent', size: 12, weight: 700, align: 'center', alpha: 0.85 });
          if (!same) s.line(R1, 0, 0, R2, { color: 'muted', width: 1.6, dash: [6, 5] });
          s.line(X1, 0, 0, X2, { color: 'accent', width: 3 });
          // intercepts
          const IL = { color: 'accent', size: 13, weight: 700 };
          if (X1 <= W - 1) { s.dot(X1, 0, { r: 4.5, color: 'accent' }); s.text(`m/p₁ = ${v.fix(X1, 1)}`, X1, 0, { ...IL, dx: 6, dy: -30, align: 'left' }); }
          else { const ye = X2 * (1 - W / X1); s.text(`m/p₁ = ${v.fix(X1, 1)} →`, W, ye, { ...IL, dx: -8, dy: -16, align: 'right' }); }
          if (X2 <= W - 1) { s.dot(0, X2, { r: 4.5, color: 'accent' }); s.text(`m/p₂ = ${v.fix(X2, 1)}`, 0, X2, { ...IL, dx: 30, dy: X2 > W - 4 ? 14 : -12, align: 'left' }); }
          else { const xe = X1 * (1 - W / X2); s.text(`m/p₂ = ${v.fix(X2, 1)} ↑`, xe, W, { ...IL, dx: 10, dy: 14, align: 'left' }); }
          // the rate of exchange
          const vis1 = Math.min(X1, W), vis2 = Math.min(X2, W);
          let xq = 0.34 * vis1, yq = X2 - k * xq;
          if (yq > 0.8 * W) { yq = 0.8 * W; xq = (X2 - yq) / k; }
          const d = Math.min(0.26 * vis1, (0.3 * vis2) / k, Math.max(0, X1 - xq) * 0.6);
          if (d * s.scale > 18 && k * d * (s.height / W) > 10) {
            s.line(xq, yq, xq + d, yq, { color: 'ink', width: 1.5 }); s.line(xq + d, yq, xq + d, yq - k * d, { color: 'red', width: 2.4 });
            s.text(`+${v.fix(d, 1)} of good 1`, xq + d / 2, yq, { dy: -9, align: 'center', size: 11.5 });
            s.text(`−${v.fix(k * d, 1)} of good 2`, xq + d, yq - (k * d) / 2, { dx: 7, align: 'left', color: 'red', size: 11.5 });
          }
          // the bundle A
          const cost = P1 * A.x + P2 * A.y, gap = M - cost, on = Math.abs(gap) < 0.012 * M;
          A.color = on ? 'accent' : gap > 0 ? 'green' : 'red';
          s.line(A.x, 0, A.x, A.y, GUIDE); s.line(0, A.y, A.x, A.y, GUIDE);
          if (!on) s.line(cost / P1, 0, 0, cost / P2, { color: A.color, width: 1.2, dash: [2, 4], alpha: 0.8 });
          // the cost bar
          const mx = Math.max(M, cost);
          b.setView([-0.07 * mx, 1.2 * mx], [0, 1.5]);
          const y = 0.62, h = 0.27, e1 = P1 * A.x, px = b.scale;
          b.rect(0, y - h, e1, y + h, { fill: 'orange', fillAlpha: 0.62, stroke: false });
          b.rect(e1, y - h, cost, y + h, { fill: 'teal', fillAlpha: 0.62, stroke: false });
          if (e1 * px > 92) b.text(`p₁x₁ = ${v.fix(e1, 1)}`, e1 / 2, y, { align: 'center', size: 11.5 });
          if ((cost - e1) * px > 92) b.text(`p₂x₂ = ${v.fix(cost - e1, 1)}`, (e1 + cost) / 2, y, { align: 'center', size: 11.5 });
          if (gap > 0.012 * M) { b.rect(cost, y - h, M, y + h, { color: 'green', width: 1.3, dash: [4, 3], fill: 'green', fillAlpha: 0.06 }); if (gap * px > 70) b.text(`${v.fix(gap, 1)} left`, (cost + M) / 2, y, { align: 'center', color: 'green', size: 11.5 }); }
          else if (gap < -0.012 * M) { b.rect(M, y - h, cost, y + h, { color: 'red', width: 2 }); b.text(`${v.fix(-gap, 1)} short`, cost, y, { dx: 8, align: 'left', color: 'red', size: 11.5, weight: 600 }); }
          b.line(M, 0.18, M, 1.08, { color: 'ink', width: 2.6 });
          b.text(`income m = ${M}`, M, 1.08, { dy: -8, align: 'center', size: 11.5, weight: 600 });
          Object.assign(st, { M, P1, P2, X1, X2, k, R1, R2, cost, gap, on });
        });
        v.readout(() => {
          const { M, P1, P2, X1, X2, k, R1, R2, cost, gap, on } = st, f = (x) => v.fix(x, 1);
          const rel = (a, c) => Math.abs(a - c) <= 1e-7 * Math.max(1, Math.abs(c));
          let cmp;
          if (rel(X1, R1) && rel(X2, R2)) cmp = rel(M, ref.m) ? 'Same line as the pinned one.' : `Prices and income have all been scaled by ${v.fix(M / ref.m, 2)}, and the line has not moved: only the ratios $p_i/m$ matter.`;
          else if (rel(X2, R2)) cmp = `Compared with the pinned line it has **pivoted about the vertical intercept** ${X1 > R1 ? 'outward' : 'inward'}: only $p_1$ changed relative to $m$.`;
          else if (rel(X1, R1)) cmp = `Compared with the pinned line it has **pivoted about the horizontal intercept** ${X2 > R2 ? 'outward' : 'inward'}: only $p_2$ changed relative to $m$.`;
          else if (rel(X1 / X2, R1 / R2)) cmp = `Same slope as the pinned line: a **parallel shift** ${X1 > R1 ? 'outward' : 'inward'}, as if income had changed by ${v.fix((100 * (X1 - R1)) / R1, 0)}%.`;
          else cmp = 'Both the slope and the position differ from the pinned line.';
          const stat = on ? 'it lies on the budget line' : gap > 0 ? `affordable, with ${f(gap)} left over` : `**not affordable**, ${f(-gap)} short`;
          return `Budget line $${f(P1)}\\,x_1 + ${f(P2)}\\,x_2 = ${M}$ with intercepts $m/p_1 = ${f(X1)}$ and $m/p_2 = ${f(X2)}$ and slope $-p_1/p_2 = ${v.fix(-k, 2)}$: each extra unit of good 1 costs ${v.fix(k, 2)} units of good 2. $A = (${f(A.x)}, ${f(A.y)})$ costs ${f(cost)}: ${stat}. ${cmp}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Concept', name: 'Kinked budget sets: taxes, subsidies, rationing',
      statement: String.raw`When the price of a good depends on how much is bought, or quantities are restricted, the budget set is no longer a triangle. A **tax on units beyond a threshold** $\bar x$ makes the boundary steeper beyond $\bar x$ (an inward kink; the set stays convex); a **discount beyond** $\bar x$ makes it flatter (an outward kink; the set becomes non-convex). An **in-kind transfer** of $V$ dollars that can only be spent on good 1 adds a flat stretch of length $V/p_1$ at the top: the set is the cash-grant triangle with a corner cut off. A **ration** $x_1 \le \bar x$ truncates the set with a vertical edge. Each boundary is piecewise linear, and the slope of each piece is minus the price ratio that applies there.`,
      idea: String.raw`Spending is still additive, but the amount spent on good 1 is now a piecewise-linear function $e(x_1)$ of the quantity, and the budget set is $\{e(x_1) + p_2x_2 \le m\}$. Its boundary $x_2 = (m - e(x_1))/p_2$ has slope $-e'(x_1)/p_2$ on each piece, so a jump in the marginal price makes a kink. If marginal prices rise, $e$ is convex and the set is convex; if they fall, convexity is lost. A voucher lets the first $V$ dollars of good 1 cost nothing out of income, which is a zero marginal price; a ration adds the constraint $x_1 \le \bar x$. A consumer whose best bundle without the policy lies across a kink often ends up exactly *at* the kink, which is why kinks produce bunching in data.`,
      caption: String.raw`Choose a policy and move its sliders. The dashed line is the ordinary budget line (income 60, $p_1 = 2$, good 2 measured in dollars); the shaded set is what the policy allows, with the region it removes in red and the region it adds in green or orange. With **show a consumer** on, a Cobb–Douglas consumer's best bundle (green) and its indifference curve are found by searching the kinked boundary; the hollow dot is the choice without the policy.`,
      deps: ['micro-4.1'], refs: ['Varian Ch. 2'], tags: ['budget'],
      see: ['micro-5.15', 'micro-3.10'],
      viz(v) {
        const m = 60, p1 = 2, X0 = m / p1;
        const VIEW = { tax: [34, 68], disc: [50, 68], voucher: [46, 96], ration: [34, 68] };
        const pol = v.select('policy', [{ value: 'tax', label: 'tax beyond $\\bar x$' }, { value: 'disc', label: 'discount beyond $\\bar x$' }, { value: 'voucher', label: 'food voucher' }, { value: 'ration', label: 'ration $x_1 \\le \\bar x$' }], 'tax');
        const xb = v.slider('threshold $\\bar x$', 2, 28, 12, { step: 0.5 });
        const t = v.slider('tax on extra units', 0.1, 2, 0.75, { step: 0.05, fmt: (x) => `${Math.round(100 * x)}%` });
        const dc = v.slider('discount on extra units', 0.1, 0.4, 0.35, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const V = v.slider('voucher value $V$', 4, 30, 20, { step: 1 });
        const show = v.toggle('show a consumer', true);
        const al = v.slider('taste for good 1, $\\alpha$', 0.1, 0.9, 0.45, { step: 0.01 });
        const s = v.stage({ x: [0, 34], y: [0, 68], height: 370, axes: 'box', xlabel: 'x₁ (food)', ylabel: 'x₂ (other goods, $)', weight: 1.3, title: 'the budget set' });
        const g = v.stage({ x: [0, 34], y: [0, 7.4], height: 370, axes: 'box', xlabel: 'x₁ (food)', ylabel: '$ per extra unit of food', title: 'marginal price against willingness to pay' });
        v.legend([['accent', 'budget set / marginal price'], ['muted', 'ordinary budget line', { dash: true }], ['purple', 'indifference curve / MRS'], ['green', 'best bundle', { dot: true }]]);
        const front = (k) => {
          const X = xb.value;
          if (k === 'voucher') { const Vv = V.value; return { pts: [[0, m], [Vv / p1, m], [(m + Vv) / p1, 0]], kinks: [[Vv / p1, m]], prices: [0, p1] }; }
          if (X >= X0 - 1e-9) return { pts: [[0, m], [X0, 0]], kinks: [], prices: [p1] };
          const y = m - p1 * X;
          if (k === 'ration') return { pts: [[0, m], [X, y], [X, 0]], kinks: [[X, y]], prices: [p1, Infinity] };
          const q = p1 * (k === 'tax' ? 1 + t.value : 1 - dc.value);
          return { pts: [[0, m], [X, y], [X + y / q, 0]], kinks: [[X, y]], prices: [p1, q] };
        };
        const height = (pts, x) => { for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; if (x <= bx + 1e-12 && bx > ax) return ay + ((by - ay) * (x - ax)) / (bx - ax); } return 0; };
        let st = {};
        v.render(() => {
          const k = pol.value, F = front(k), pts = F.pts, last = pts[pts.length - 1], [XM, YM] = VIEW[k];
          xb.el.hidden = k === 'voucher'; t.el.hidden = k !== 'tax'; dc.el.hidden = k !== 'disc'; V.el.hidden = k !== 'voucher'; al.el.hidden = !show.value;
          s.setView([0, XM], [0, YM]); g.setView([0, XM], [0, 7.4]);
          s.poly([[0, 0], ...pts], { fill: 'accent', fillAlpha: 0.14, stroke: false });
          const kink = F.kinks[0];
          if (kink && k === 'tax') { s.poly([kink, [X0, 0], last], { fill: 'red', fillAlpha: 0.16, stroke: false }); s.text('lost to the tax', X0, 0.16 * YM, { dx: 8, color: 'red', size: 11.5, weight: 600, align: 'left' }); }
          if (kink && k === 'ration') { s.poly([kink, [X0, 0], last], { fill: 'red', fillAlpha: 0.16, stroke: false }); s.text('rationed away', kink[0], 0.12 * YM, { dx: 8, color: 'red', size: 11.5, weight: 600, align: 'left' }); }
          if (kink && k === 'disc') { s.poly([kink, last, [X0, 0]], { fill: 'green', fillAlpha: 0.18, stroke: false }); s.text('gained from the discount', last[0], 0.16 * YM, { dx: -4, color: 'green', size: 11.5, weight: 600, align: 'right' }); }
          if (k === 'voucher') {
            const Vv = V.value; s.poly([[0, m], [0, m + Vv], [Vv / p1, m]], { fill: 'orange', fillAlpha: 0.22, stroke: false });
            s.line(0, m + Vv, (m + Vv) / p1, 0, { color: 'orange', width: 1.5, dash: [5, 4] });
            s.text('cash of the same value', (0.55 * Vv) / p1, m + 0.5 * Vv, { dx: 8, dy: -2, color: 'orange', size: 11.5, weight: 600, align: 'left' });
            s.text('would also buy these', (0.55 * Vv) / p1, m + 0.5 * Vv, { dx: 8, dy: 13, color: 'orange', size: 11.5, weight: 600, align: 'left' });
          }
          s.line(X0, 0, 0, m, { color: 'muted', width: 1.5, dash: [6, 5] });
          s.path(pts, { color: 'accent', width: 3.2 });
          for (let i = 0; i + 1 < pts.length; i++) { // slopes of the pieces, written inside the set
            const pr = F.prices[i], lab = pr === Infinity ? 'no more allowed' : pr === 0 ? 'slope 0' : `slope −${v.fix(pr, 2)}`;
            segLabel(s, pts[i], pts[i + 1], lab, [1e3, 1e3], { color: 'accent', weight: 600 }, 13);
          }
          if (kink) s.dot(kink[0], kink[1], { r: 5, color: 'accent', label: 'kink', labelPos: k === 'voucher' ? 'ne' : 'sw' });
          // right: the marginal price of food along the boundary
          for (let i = 0; i + 1 < pts.length; i++) {
            const pr = F.prices[i], a = pts[i][0], b = pts[i + 1][0];
            if (pr === Infinity) { g.vband(a, XM, { color: 'red', alpha: 0.1 }); g.vline(a, { color: 'red', width: 2.6 }); g.text('ration: no more food', a, 6.6, { dx: 8, color: 'red', size: 11.5, weight: 600, align: 'left' }); continue; }
            g.line(a, pr, b, pr, { color: 'accent', width: 3 });
            if (i > 0 && F.prices[i - 1] !== Infinity) g.line(a, F.prices[i - 1], a, pr, { color: 'accent', width: 1.4, dash: [4, 3] });
            g.text(pr === 0 ? 'free: the voucher pays' : `${v.fix(pr, 2)}`, (a + Math.min(b, XM)) / 2, pr, { dy: pr > 6.6 ? 12 : -10, align: 'center', color: 'accent', size: 11.5, weight: 600 });
          }
          g.vline(last[0], { color: 'faint', width: 1, dash: [3, 3] });
          let opt = null, base = null, cash = null, Fu = null, mrs = null;
          if (show.value) {
            const a = al.value; Fu = prefs('cd', { a });
            opt = bestOnPath(Fu.u, pts); base = { p: [(a * m) / p1, (1 - a) * m], u: Fu.u((a * m) / p1, (1 - a) * m) };
            if (k === 'voucher') { const M2 = m + V.value; cash = { p: [(a * M2) / p1, (1 - a) * M2] }; cash.u = Fu.u(...cash.p); }
            s.clip(() => drawLevel(s, Fu, opt.u, { color: 'purple', width: 2 }));
            s.dot(base.p[0], base.p[1], { r: 5, hollow: true, color: 'muted', width: 2 });
            if (cash && cash.p[1] < YM) s.dot(cash.p[0], cash.p[1], { r: 5, hollow: true, color: 'orange', width: 2 });
            s.line(opt.p[0], 0, opt.p[0], opt.p[1], GUIDE);
            s.dot(opt.p[0], opt.p[1], { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
            // willingness to pay for one more unit of food at the boundary bundle with that much food
            const W = (x) => { const y = height(pts, x); return y > 0 ? (a / (1 - a)) * (y / x) : NaN; };
            g.clip(() => g.fn(W, { domain: [0.05, last[0] - 1e-6], color: 'purple', width: 2.4, n: 300 }));
            const xs = opt.p[0]; mrs = (a / (1 - a)) * (opt.p[1] / Math.max(xs, 1e-9));
            g.line(xs, 0, xs, Math.min(mrs, 7.4), GUIDE);
            if (mrs < 7.2) g.dot(xs, mrs, { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
            g.text('MRS', 0.06 * XM, Math.min(W(0.06 * XM), 7), { dx: 8, dy: 4, color: 'purple', size: 12, weight: 700, align: 'left', baseline: 'top' });
          }
          const area = Math.abs(v.M.polyArea([[0, 0], ...pts]));
          st = { k, F, kink, opt, base, cash, area, mrs };
        });
        v.readout(() => {
          const { k, F, kink, opt, base, cash, area, mrs } = st, f = (x) => v.fix(x, 1), X = xb.value;
          const sz = `Budget set ${f(area)} square units (ordinary: ${f(0.5 * m * X0)}).`;
          let msg;
          if (k === 'tax') msg = kink ? `The first ${f(X)} units of food cost 2 each, further units ${v.fix(F.prices[1], 2)}: the boundary bends **inward** at $\\bar x$ and the set stays convex.` : 'The threshold lies beyond what income can buy: no kink.';
          else if (k === 'disc') msg = kink ? `Beyond ${f(X)} units food costs only ${v.fix(F.prices[1], 2)}: the boundary bends **outward** and the set is not convex (the chord between its two corners leaves it).` : 'The threshold lies beyond what income can buy: no kink.';
          else if (k === 'voucher') msg = `The voucher pays for the first ${f(V.value / p1)} units of food, so that stretch is flat: that food costs no other goods. Cash of the same value would add the orange corner.`;
          else msg = kink ? `At most ${f(X)} units may be bought: a vertical edge truncates the set.` : 'The ration is not binding.';
          if (!opt) return `${msg} ${sz}`;
          const atK = kink && Math.abs(opt.p[0] - kink[0]) < 0.02 && Math.abs(opt.p[1] - kink[1]) < 0.05;
          let who = `Best bundle $x^* = (${f(opt.p[0])}, ${f(opt.p[1])})$ (without the policy $(${f(base.p[0])}, ${f(base.p[1])})$), where the consumer would pay $\\mathrm{MRS} = ${v.fix(mrs, 2)}$ for one more unit of food.`;
          if (atK) { const ps = F.prices.map((p) => (p === Infinity ? '∞' : v.fix(p, 2))); who += ` It sits **exactly at the kink**: the willingness to pay lies between the marginal prices ${ps[0]} and ${ps[1]}, so buying either more or less food would lose.`; }
          if (cash) who += cash.u > opt.u + 1e-6 ? ` This consumer would rather have the cash: it would reach $u = ${v.fix(cash.u, 2)}$ instead of $${v.fix(opt.u, 2)}$.` : ' Cash would not help this consumer: the voucher does not bind.';
          return `${msg} ${who} ${sz}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Definition', name: 'Preference relation: completeness and transitivity',
      statement: String.raw`A **preference relation** $\succsim$ on a set $X$ of bundles is a binary relation, with $x \succsim y$ read as "$x$ is at least as good as $y$". From it one defines **strict preference** $x \succ y$ (meaning $x \succsim y$ but not $y \succsim x$) and **indifference** $x \sim y$ (meaning $x \succsim y$ and $y \succsim x$). The relation is **rational** if it is
(a) **complete**: for all $x, y$, $x \succsim y$ or $y \succsim x$ (or both), so any two bundles can be compared; and
(b) **transitive**: $x \succsim y$ and $y \succsim z$ imply $x \succsim z$.
Then $\succsim$ is reflexive, $\sim$ is an equivalence relation, and $\succ$ is transitive. On a finite set a rational preference is a ranking of the bundles from best to worst, possibly with ties.`,
      idea: String.raw`Completeness says the consumer always has an answer; transitivity says the answers are consistent. Without transitivity choice can be ill-defined: if $x \succ y \succ z \succ x$, every option in $\{x, y, z\}$ has a better one, so no best choice exists. Such a cycle also makes the consumer a **money pump**: holding $x$, they would pay a little to swap it for $z$, then for $y$, then for $x$ again, ending where they started but poorer, and they would do it again. Transitivity is therefore the assumption that does the work in what follows: it makes indifference an equivalence relation (so indifference curves are well defined) and it is necessary for a utility representation (4.7).`,
      caption: String.raw`Say which bundle you prefer for each pair. Use the buttons for the current pair (gold rings), click two bundles in the plane to choose another pair, or click a cell of the table. Arrows point from the worse bundle to the better one, in the direction you would trade. The table records every answer. The page checks completeness and searches for a cycle; any cycle is drawn in red, and **trade around the cycle** runs the money pump. The preset answers contain a cycle: overrule one of its answers and it disappears, and once all pairs are answered without a cycle your ranking appears.`,
      deps: [], refs: ['Varian Ch. 3'], tags: ['preferences'],
      see: ['pma-1.5', 'alg-1.20a', 'behav-3.17'],
      credit: 'Money pump: Davidson, McKinsey & Suppes, 1955',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Preference_(economics)' },
      viz(v) {
        const B = [['A', 1.5, 8.5], ['B', 4.5, 4], ['C', 8.5, 1.5], ['D', 6, 8], ['E', 2, 2.5], ['F', 9, 5]], n = B.length, NM = B.map((b) => b[0]);
        const U = (i) => B[i][1] * B[i][2];
        let ans = {}, cur = [0, 1], pick = [], pump = 0;
        const key = (i, j) => (i < j ? `${i},${j}` : `${j},${i}`);
        const get = (i, j) => { if (i === j) return 0; const a = ans[key(i, j)]; return a == null ? null : i < j ? a : -a; }; // 1: i ≻ j, 0: i ∼ j, −1: j ≻ i
        const put = (i, j, r) => { ans[key(i, j)] = i < j ? r : -r; pump = 0; };
        const consistent = () => { ans = {}; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) put(i, j, Math.sign(U(i) - U(j))); };
        consistent(); put(0, 1, 1); put(2, 0, 1); // the preset: A ≻ B and C ≻ A, with B ≻ C a cycle
        const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j]);
        const advance = () => { const i0 = pairs.findIndex(([i, j]) => key(i, j) === key(...cur)); for (let s = 1; s <= pairs.length; s++) { const p = pairs[(i0 + s) % pairs.length]; if (get(...p) == null) { cur = p; return; } } cur = pairs[(i0 + 1) % pairs.length]; };
        v.button('first is better', () => { put(cur[0], cur[1], 1); advance(); });
        v.button('equally good', () => { put(cur[0], cur[1], 0); advance(); });
        v.button('second is better', () => { put(cur[0], cur[1], -1); advance(); });
        v.button('trade around the cycle', () => { pump++; });
        v.button('answer as u = x₁·x₂', () => { consistent(); });
        v.button('clear answers', () => { ans = {}; pump = 0; cur = [0, 1]; });
        const s = v.stage({ x: [0, 10.4], y: [0, 10.4], height: 350, axes: 'box', xlabel: 'apples', ylabel: 'bananas', weight: 1.1 });
        const tb = v.stage({ x: [0, 1], y: [0, 1], height: 350, axes: false, title: 'your answers: does the row beat the column?' });
        const T = v.table(tb, { rows: n, cols: n, rowLabels: NM, colLabels: NM, cornerLabel: '', maxCell: 44, size: 17, labelSize: 15 });
        s.onClick((x, y) => {
          let bi = -1, bd = 0.7; B.forEach(([, bx, by], i) => { const d = Math.hypot(bx - x, by - y); if (d < bd) { bd = d; bi = i; } });
          if (bi < 0) return; pick.push(bi); if (pick.length === 2) { if (pick[0] !== pick[1]) cur = [pick[0], pick[1]]; pick = []; }
        });
        tb.onClick((x, y) => { const c = T.hit(x, y); if (c && c.i >= 0 && c.j >= 0 && c.i !== c.j) cur = [c.i, c.j]; });
        // shortest cycle in "j ≿ i" (trade-up) edges that contains a strict step: a violation of transitivity
        const findCycle = () => {
          let best = null; const path = [];
          const strict = (cyc) => cyc.some((a, q) => get(a, cyc[(q + 1) % cyc.length]) === -1);
          const dfs = (start, u, seen) => {
            for (let w = 0; w < n; w++) {
              if (w === u) continue; const r = get(u, w); if (r == null || r > 0) continue;
              if (w === start) { if (path.length >= 3 && strict(path) && (!best || path.length < best.length)) best = [...path]; continue; }
              if (w < start || seen.has(w) || (best && path.length + 1 >= best.length)) continue;
              seen.add(w); path.push(w); dfs(start, w, seen); path.pop(); seen.delete(w);
            }
          };
          for (let s0 = 0; s0 < n; s0++) { path.length = 0; path.push(s0); dfs(s0, s0, new Set([s0])); }
          return best;
        };
        let st = {};
        v.render(() => {
          const cyc = findCycle(), done = pairs.filter((p) => get(...p) != null).length, inCyc = new Set();
          if (cyc) cyc.forEach((a, q) => { const b = cyc[(q + 1) % cyc.length]; inCyc.add(key(a, b)); });
          const P = (i) => [B[i][1], B[i][2]];
          // arrows and indifference links
          for (const [i, j] of pairs) {
            const r = get(i, j); if (r == null) continue;
            const red = inCyc.has(key(i, j));
            if (r === 0) s.line(...P(i), ...P(j), { color: red ? 'red' : 'purple', width: red ? 2.6 : 1.6, dash: [5, 4], alpha: red ? 1 : 0.75 });
            else { const [lo, hi] = r > 0 ? [j, i] : [i, j]; trimArrow(s, P(lo), P(hi), { color: red ? 'red' : 'muted', width: red ? 2.8 : 1.3, alpha: red ? 1 : 0.55, head: red ? 10 : 7 }); }
          }
          // money pump: where the trader is after `pump` trades, and what it has cost
          let hold = null, paid = 0;
          if (cyc && pump > 0) { const L = cyc.length; for (let q = 0; q < pump; q++) { const a = cyc[q % L], b = cyc[(q + 1) % L]; if (get(a, b) === -1) paid++; } hold = cyc[pump % L]; }
          if (cyc) cyc.forEach((a, q) => { const b = cyc[(q + 1) % cyc.length]; if (get(a, b) === -1) { const [x1, y1] = P(a), [x2, y2] = P(b); s.text('−1¢', (x1 + x2) / 2, (y1 + y2) / 2, { color: 'red', size: 11.5, weight: 700, dy: -10, align: 'center' }); } });
          // bundles
          const order = !cyc && done === pairs.length ? B.map((_, i) => B.reduce((c, __, j) => c + (get(i, j) === 1 ? 1 : 0), 0)) : null;
          B.forEach(([nm, x, y], i) => {
            const isCur = cur.includes(i);
            if (isCur) s.dot(x, y, { r: 13, hollow: true, color: 'gold', width: 3 });
            if (pick.includes(i)) s.dot(x, y, { r: 13, hollow: true, color: 'accent', width: 2 });
            if (hold === i) s.dot(x, y, { r: 18, hollow: true, color: 'red', width: 2 });
            s.dot(x, y, { r: 7, color: order ? v.mix('red', 'green', order[i] / (n - 1)) : 'accent' });
            s.text(nm, x, y, { dx: 11, dy: -11, size: 14, weight: 700, color: 'ink' });
          });
          if (cur[0] === cur[1]) cur = [0, 1];
          s.setTitle(`compare **${NM[cur[0]]}** = (${B[cur[0]][1]}, ${B[cur[0]][2]}) with **${NM[cur[1]]}** = (${B[cur[1]][1]}, ${B[cur[1]][2]})`);
          // table
          const sym = (i, j) => { if (i === j) return '∼'; const r = get(i, j); return r == null ? '·' : r > 0 ? '≻' : r < 0 ? '≺' : '∼'; };
          const hl = [[cur[0], cur[1], 'gold'], [cur[1], cur[0], 'gold']];
          if (cyc) cyc.forEach((a, q) => { const b = cyc[(q + 1) % cyc.length]; hl.push([a, b, 'red'], [b, a, 'red']); });
          T.draw({
            value: sym,
            fill: (i, j) => { if (i === j) return ['faint', 0.16]; const r = get(i, j); return r == null ? null : r > 0 ? ['blue', 0.2] : r < 0 ? ['orange', 0.2] : ['purple', 0.2]; },
            textColor: (i, j) => (get(i, j) == null ? 'faint' : 'ink'),
            highlight: hl,
          });
          st = { cyc, done, order, paid, hold };
        });
        v.readout(() => {
          const { cyc, done, order, paid, hold } = st, N = pairs.length;
          const comp = done === N ? `All ${N} pairs answered: the answers are **complete**.` : `${done} of ${N} pairs answered: **not yet complete** (each unanswered pair is a dot in the table).`;
          if (cyc) {
            const L = cyc.length, steps = cyc.map((a, q) => { const b = cyc[(q + 1) % L], r = get(a, b); return `${NM[b]} ${r === -1 ? '≻' : '∼'} ${NM[a]}`; });
            const fees = cyc.filter((a, q) => get(a, cyc[(q + 1) % L]) === -1).length;
            const pumpTxt = st.hold != null ? ` After ${pump} trade${pump > 1 ? 's' : ''} the trader holds **${NM[hold]}** and has paid ${paid}¢.` : '';
            return `${comp} **Not transitive**: ${steps.join(', ')}, a cycle. Money pump: starting with ${NM[cyc[0]]}, swap along the red arrows, paying 1¢ for each strict improvement; one lap returns ${NM[cyc[0]]} and costs ${fees}¢, and a consumer with these preferences would agree to every lap.${pumpTxt}`;
          }
          if (order) {
            const ix = [...B.keys()].sort((a, b) => order[b] - order[a]); let txt = NM[ix[0]];
            for (let q = 1; q < n; q++) txt += ` ${get(ix[q - 1], ix[q]) === 0 ? '∼' : '≻'} ${NM[ix[q]]}`;
            return `${comp} No cycle: the answers are **transitive**, so they form a ranking, ${txt} (bundles coloured from worst, red, to best, green). Ties are your indifferences.`;
          }
          return `${comp} No cycle among the answers so far: transitivity has not been violated yet.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Definition', name: 'Indifference curves',
      statement: String.raw`For a rational preference $\succsim$ on bundles $(x_1, x_2)$ and a bundle $a$, the **indifference curve** through $a$ is the set $I(a) = \{x : x \sim a\}$ of bundles exactly as good as $a$. It splits the plane into the **weakly preferred set** $\{x : x \succsim a\}$, whose boundary it is, and the **worse set** $\{x : a \succ x\}$. Because $\sim$ is an equivalence relation, the indifference curves partition the commodity space; the family of all of them is the **indifference map**, and it carries all the information in $\succsim$.`,
      idea: String.raw`Indifference is reflexive, symmetric and transitive (4.3), so its equivalence classes are disjoint and cover every bundle; that is what makes a map of curves possible at all. The shape of the curves encodes the tastes. When both goods are desirable the curves slope downward, since more of one good must be offset by less of the other, and the preferred set lies to the north-east. A bad good makes them slope upward, a neutral good makes them vertical, and satiation turns them into closed loops around a bliss point. Perfect substitutes give straight lines and perfect complements L-shapes.`,
      caption: String.raw`Choose a preference and drag the reference bundle $A$: its indifference curve is the bold purple line, with the weakly preferred set in green and the worse set in red, over a faint map of other curves. Drag the test bundle $B$: it turns green, purple or red as it is better than, as good as, or worse than $A$ (for the first four preferences it snaps onto $A$'s curve when close). On the right each curve of the map is one rung of a ladder: the map is a ranking of curves.`,
      deps: ['micro-4.3'], refs: ['Varian Ch. 3', 'Mankiw Ch. 21'], tags: ['preferences'],
      see: ['alg-1.24a'],
      credit: 'Francis Y. Edgeworth, 1881; Vilfredo Pareto, 1906',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Indifference_curve' },
      viz(v) {
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd'), levels: [1, 2, 3, 4, 5, 6, 7, 8, 9], eq: (L) => `x_1^{1/2}x_2^{1/2} = ${v.fix(L, 2)}`, note: 'Cobb–Douglas: smooth curves bowed toward the origin; both goods are desirable.' },
          subs: { label: 'perfect substitutes', F: prefs('subs', { a: 2, b: 1 }), levels: [3, 6, 9, 12, 15, 18, 21, 24, 27], eq: (L) => `2x_1 + x_2 = ${v.fix(L, 2)}`, note: 'Perfect substitutes: straight lines; one unit of good 1 always replaces two of good 2.' },
          comp: { label: 'perfect complements', F: prefs('comp'), levels: [1, 2, 3, 4, 5, 6, 7, 8, 9], eq: (L) => `\\min(x_1, x_2) = ${v.fix(L, 2)}`, note: 'Perfect complements: L-shapes; extra units of either good alone (a left shoe without a right one) add nothing.' },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 3 }), levels: [0, 2, 4, 6, 8, 10, 12, 14], eq: (L) => `3\\ln x_1 + x_2 = ${v.fix(L, 2)}`, note: 'Quasilinear: every curve is a vertical shift of every other.' },
          bad: { label: 'good 2 is a bad', F: prefs('bad', { c: 0.1 }), levels: [-8, -6, -4, -2, 0, 2, 4, 6, 8], eq: (L) => `x_1 - 0.1\\,x_2^2 = ${v.fix(L, 2)}`, note: 'Good 2 is a bad (say, noise): the curves slope upward, since more of it must be compensated by more of good 1.' },
          sat: { label: 'satiation', F: prefs('sat', { bx: 6, by: 5.5 }), levels: [-1, -4, -9, -16, -25, -36], eq: (L) => `(x_1 - 6)^2 + (x_2 - 5.5)^2 = ${v.fix(-L, 2)}`, note: 'Satiation: closed curves around a bliss point; beyond it, more is worse.' },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 430, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1 });
        const lad = v.stage({ x: [0, 1], y: [0, 1], height: 430, axes: false, weight: 0.42, minWidth: 170, title: 'the map as a ranking' });
        const box = (x, y) => [clamp(x, 0.05, 9.95), clamp(y, 0.05, 9.95)];
        const A = s.handle(3, 4, { color: 'accent', label: 'A', constrain: box });
        const Bh = s.handle(7, 6.5, { color: 'gold', label: 'B', labelPos: 'e', constrain: (x, y) => {
          const o = FAM[fam.value], F = o.F, uA = F.u(A.x, A.y); [x, y] = box(x, y);
          if (F.ray) { const p = onRay(F, uA, x, y); if (p && Math.hypot((p[0] - x) * s.scale, (p[1] - y) * s.scale) < 10) return p; }
          return [x, y];
        } });
        v.legend([['purple', 'indifference curve through A'], ['green', 'weakly preferred to A', { area: true }], ['red', 'worse than A', { area: true }]]);
        let st = {};
        v.render(() => {
          const o = FAM[fam.value], F = o.F, uA = F.u(A.x, A.y);
          shadeSets(v, s, F.u, uA, fam.value, { a1: 0.17, a2: 0.09 });
          for (const L of o.levels) drawLevel(s, F, L, { color: v.color('purple', 0.32), width: 1.1 });
          drawLevel(s, F, uA, { color: 'purple', width: 3 });
          if (F.bliss) s.dot(...F.bliss, { r: 4.5, color: 'green', label: 'bliss', labelPos: 's' });
          s.setTitle(`the indifference curve through $A$: $${o.eq(uA)}$`);
          const far = (x, y) => Math.hypot(x - A.x, y - A.y) > 1.6 && Math.hypot(x - Bh.x, y - Bh.y) > 1.6;
          placeLabel(s, 'better than A', [[8.4, 9.3], [8.4, 0.8], [F.bliss ? F.bliss[0] : 6, F.bliss ? F.bliss[1] - 1.1 : 6], [5, 9.3], [1.6, 9.3]], (x, y) => F.u(x, y) > uA && far(x, y), { color: 'green' });
          placeLabel(s, 'worse than A', [[1.4, 0.8], [1.4, 9.3], [8.4, 9.3], [8.4, 0.8], [5, 0.8]], (x, y) => F.u(x, y) < uA && far(x, y), { color: 'red' });
          const uB = F.u(Bh.x, Bh.y), tol = 1e-6 * Math.max(1, Math.abs(uA));
          const rel = uB > uA + tol ? 1 : uB < uA - tol ? -1 : 0;
          Bh.color = rel > 0 ? 'green' : rel < 0 ? 'red' : 'purple';
          // the ranking: each indifference curve is one rung, ordered from worse to better
          const all = [...o.levels, uA, uB, ...(F.bliss ? [0] : [])], lo = Math.min(...all), hi = Math.max(...all), pd = 0.09 * (hi - lo || 1);
          lad.setView([0, 1], [lo - pd, hi + 1.6 * pd]);
          lad.hband(uA, hi + 2 * pd, { color: 'green', alpha: 0.13 }); lad.hband(lo - 2 * pd, uA, { color: 'red', alpha: 0.08 });
          lad.arrow(0.16, lo - 0.6 * pd, 0.16, hi + 1.2 * pd, { color: 'muted', width: 1.4, head: 8 });
          lad.text('better', 0.16, hi + 1.2 * pd, { dx: 8, dy: 4, color: 'muted', size: 11.5, align: 'left' });
          for (const L of o.levels) lad.line(0.1, L, 0.5, L, { color: 'purple', width: 1.2, alpha: 0.45 });
          if (F.bliss) { lad.dot(0.3, 0, { r: 4.5, color: 'green' }); lad.text('bliss', 0.3, 0, { dx: 9, color: 'green', size: 11.5, align: 'left' }); }
          lad.line(0.06, uA, 0.94, uA, { color: 'purple', width: 3 });
          lad.text('curve of A', 0.94, uA, { dy: -9, align: 'right', color: 'purple', size: 11.5, weight: 600 });
          lad.dot(0.3, uA, { r: 6, color: 'accent' }); lad.text('A', 0.3, uA, { dx: -10, align: 'right', color: 'accent', size: 13, weight: 700 });
          lad.dot(0.62, uB, { r: 6, color: Bh.color }); lad.text('B', 0.62, uB, { dx: 10, align: 'left', color: Bh.color, size: 13, weight: 700 });
          st = { o, uA, uB, rel };
        });
        v.readout(() => {
          const { o, uA, uB, rel } = st, f = (x) => v.fix(x, 1);
          const r = rel > 0 ? '$B \\succ A$: $B$ is in the preferred set' : rel < 0 ? '$A \\succ B$: $B$ is in the worse set' : '$B \\sim A$: $B$ is on the indifference curve of $A$';
          return `${o.note} $A = (${f(A.x)}, ${f(A.y)})$ and $B = (${f(Bh.x)}, ${f(Bh.y)})$; an index that labels each curve (here $u(A) = ${v.fix(uA, 3)}$, $u(B) = ${v.fix(uB, 3)}$) puts them on the rungs shown on the right: ${r}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Proposition', name: 'Indifference curves cannot cross',
      statement: String.raw`If $\succsim$ is transitive, two indifference curves that have a bundle in common coincide: distinct indifference curves never meet, let alone cross. In particular, for monotone preferences (more of both goods is better), no picture in which two indifference curves cross at a bundle $X$ and separate again can describe any preferences.`,
      idea: String.raw`Suppose the curves through $P$ and $Q$ both pass through $X$, with $Q$ directly above $P$ (same amount of good 1, more of good 2). Then $P \sim X$ and $X \sim Q$, so transitivity gives $P \sim Q$; but $Q$ has more of good 2 and no less of good 1, so monotonicity gives $Q \succ P$. The contradiction shows the two curves are one and the same. In fact transitivity alone settles it: indifference curves are the equivalence classes of $\sim$ (4.4), and two equivalence classes that share an element are equal. Where indifference fails to be transitive, as with a threshold below which differences go unnoticed, "indifference curves" become overlapping bands and the argument breaks down.`,
      caption: String.raw`**Transitive** mode: two curves are forced through the crossing point $X$ (drag it, and change the slope of the second curve). Drag $P$ along the first curve; $Q$ sits on the second curve directly above or below it. The diagram on the right runs the argument: transitivity says $P \sim Q$, monotonicity says the higher one is strictly better, and the clash is marked in red. **Threshold** mode drops transitivity: bundles count as indifferent when their utilities differ by at most $\delta$. The indifference sets of $P$ and $Q$ are then bands that overlap around $X$, and there is no contradiction.`,
      deps: ['micro-4.4'], refs: ['Varian Ch. 3'], tags: ['preferences'],
      see: ['alg-1.24a'],
      viz(v) {
        const mode = v.select('preferences', [{ value: 'tr', label: 'transitive' }, { value: 'thr', label: 'threshold (not transitive)' }], 'tr');
        const a2 = v.slider('slope of the second curve', 0.08, 0.92, 0.22, { step: 0.01 });
        const del = v.slider('threshold $\\delta$', 0.1, 1, 0.5, { step: 0.01 });
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 380, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.35 });
        const g = v.stage({ x: [0, 10], y: [0, 10], height: 380, axes: false, title: 'the argument' });
        const X = s.handle(4.2, 4.6, { color: 'accent', label: 'X', labelPos: 'nw', constrain: (x, y) => [clamp(x, 1.5, 8.5), clamp(y, 1.5, 8.5)] });
        const curveY = (a, x0, y0) => (x) => (x0 ** a * y0 ** (1 - a) / x ** a) ** (1 / (1 - a)); // x^a y^(1−a) = const through (x0, y0)
        const uT = (x, y) => Math.sqrt(Math.max(x, 0) * Math.max(y, 0));
        const lvlY = (L, x) => (L * L) / x;
        const P = s.handle(7.2, 3, { color: 'purple', label: 'P', labelPos: 'se', constrain: (x) => {
          x = clamp(x, 0.6, 9.6);
          if (mode.value === 'tr') return [x, clamp(curveY(0.5, X.x, X.y)(x), 0, 10)];
          return [x, lvlY(uT(X.x, X.y) - 0.7 * del.value, x)];
        } });
        let st = {};
        v.render(() => {
          const tr = mode.value === 'tr';
          a2.el.hidden = !tr; del.el.hidden = tr;
          let Py, Qy, uP, uX = uT(X.x, X.y), uQ;
          if (tr) {
            const c1 = curveY(0.5, X.x, X.y), c2 = curveY(a2.value, X.x, X.y);
            P.y = c1(P.x); Py = P.y; Qy = c2(P.x);
            s.clip(() => { s.fn(c1, { domain: [0.05, 10], color: 'purple', width: 2.6 }); s.fn(c2, { domain: [0.05, 10], color: 'teal', width: 2.6 }); });
            s.text('curve 1', 9.7, Math.min(c1(9.7), 9.4), { dy: -12, align: 'right', color: 'purple', size: 12, weight: 600 });
            const yl = c2(9.7); s.text('curve 2', 9.7, clamp(yl, 0.6, 9.4), { dy: yl > c1(9.7) ? -12 : 12, align: 'right', color: 'teal', size: 12, weight: 600 });
          } else {
            const d = del.value; uP = uX - 0.7 * d; uQ = uX + 0.7 * d;
            P.y = lvlY(uP, P.x); Py = P.y; Qy = lvlY(uQ, P.x);
            const cp = v.rgb('purple'), ct = v.rgb('teal');
            s.raster((x, y) => { const w = uT(x, y), inP = Math.abs(w - uP) <= d, inQ = Math.abs(w - uQ) <= d; if (!inP && !inQ) return null; if (inP && inQ) return [(cp[0] + ct[0]) / 2, (cp[1] + ct[1]) / 2, (cp[2] + ct[2]) / 2, 95]; return inP ? [cp[0], cp[1], cp[2], 60] : [ct[0], ct[1], ct[2], 60]; }, { key: `${uP}|${uQ}|${d}|${cp}${ct}`, res: 2 });
            s.clip(() => { s.fn((x) => lvlY(uP, x), { domain: [0.05, 10], color: 'purple', width: 1.4, dash: [5, 4] }); s.fn((x) => lvlY(uQ, x), { domain: [0.05, 10], color: 'teal', width: 1.4, dash: [5, 4] }); });
            s.text('bundles indifferent to P', 9.7, 1.0, { align: 'right', color: 'purple', size: 11.5, weight: 600 });
            s.text('bundles indifferent to Q', 9.7, 9.4, { align: 'right', color: 'teal', size: 11.5, weight: 600 });
          }
          const hi = Qy >= Py ? 'Q' : 'P', lo = hi === 'Q' ? 'P' : 'Q', yLo = Math.min(Py, Qy), yHi = Math.max(Py, Qy);
          const gap = Math.abs(Qy - Py) > 0.02 && Math.abs(P.x - X.x) > 0.05;
          if (gap && yLo < 10) {
            s.rect(P.x, yLo, 10, 10, { fill: 'green', fillAlpha: 0.07, color: 'green', width: 1, dash: [4, 3] });
            s.text(`at least as much of both as ${lo}`, Math.min(P.x + 0.15, 7.2), Math.min(yLo, 9.2) + 0.35, { color: 'green', size: 11, align: 'left' });
            if (yHi < 10) s.arrow(P.x, yLo, P.x, yHi, { color: 'green', width: 2.2, head: 8 });
          }
          if (Qy < 10) s.dot(P.x, Qy, { r: 6, color: 'teal', label: 'Q', labelPos: Qy > Py ? 'ne' : 'se' });
          if (tr && gap) s.dot(X.x, X.y, { r: 13, hollow: true, color: 'red', width: 2.2 });
          // the argument, drawn as a triangle of relations
          const N = { X: [5, 8.4], P: [1.6, 2.5], Q: [8.4, 2.5] };
          const node = (k, col) => { g.dot(...N[k], { r: 17, color: col, alpha: 0.18 }); g.dot(...N[k], { r: 17, hollow: true, color: col, width: 2 }); g.tex(k, ...N[k], { size: 18, color: col }); };
          const trim = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
          g.line(...trim(N.X, N.P, 0.17), ...trim(N.X, N.P, 0.83), { color: 'purple', width: 2.2 });
          g.line(...trim(N.X, N.Q, 0.17), ...trim(N.X, N.Q, 0.83), { color: 'teal', width: 2.2 });
          if (tr) {
            g.tex('P \\sim X', 2.2, 5.9, { color: 'purple', size: 15, align: 'right' }); g.text('same curve', 2.2, 5.0, { color: 'purple', size: 11, align: 'right' });
            g.tex('X \\sim Q', 7.8, 5.9, { color: 'teal', size: 15, align: 'left' }); g.text('same curve', 7.8, 5.0, { color: 'teal', size: 11, align: 'left' });
          } else {
            const d = del.value;
            g.tex(`|u_X - u_P| = ${v.fix(uX - uP, 2)} \\le \\delta`, 2.6, 6.2, { color: 'purple', size: 13, align: 'right' }); g.tex('P \\sim X', 2.6, 5.2, { color: 'purple', size: 15, align: 'right' });
            g.tex(`|u_Q - u_X| = ${v.fix(uQ - uX, 2)} \\le \\delta`, 7.4, 6.2, { color: 'teal', size: 13, align: 'left' }); g.tex('X \\sim Q', 7.4, 5.2, { color: 'teal', size: 15, align: 'left' });
            void d;
          }
          if (!gap) {
            g.text(Math.abs(P.x - X.x) <= 0.05 ? 'move P away from X' : 'the two curves coincide here', 5, 2.5, { color: 'muted', size: 12, align: 'center' });
          } else if (tr) {
            const [La, Lb] = hi === 'Q' ? ['P', 'Q'] : ['Q', 'P'];
            g.arrow(...trim(N[La], N[Lb], 0.2), ...trim(N[La], N[Lb], 0.8), { color: 'green', width: 2.4, head: 9 });
            g.tex(`${hi} \\succ ${lo}`, 5, 3.55, { color: 'green', size: 16 }); g.text('monotonicity: more of good 2', 5, 4.45, { color: 'green', size: 11, align: 'center' });
            g.line(N.P[0] + 1.2, 1.25, N.Q[0] - 1.2, 1.25, { color: 'purple', width: 1.6, dash: [5, 4] });
            g.tex('P \\sim Q', 5, 0.62, { color: 'purple', size: 15 }); g.text('transitivity', 5, 1.75, { color: 'purple', size: 11, align: 'center' });
            g.text('✗', 5, 2.5, { color: 'red', size: 24, weight: 800, align: 'center' });
            g.text('contradiction', 6.1, 2.5, { color: 'red', size: 12, weight: 700, align: 'left' });
          } else {
            g.arrow(...trim(N.P, N.Q, 0.2), ...trim(N.P, N.Q, 0.8), { color: 'green', width: 2.4, head: 9 });
            g.tex(`|u_Q - u_P| = ${v.fix(uQ - uP, 2)} > \\delta`, 5, 3.7, { color: 'green', size: 13 }); g.tex('Q \\succ P', 5, 1.55, { color: 'green', size: 16 });
            g.text('no transitivity, no contradiction', 5, 0.55, { color: 'muted', size: 11.5, align: 'center' });
          }
          node('X', 'accent'); node('P', 'purple'); node('Q', 'teal');
          st = { tr, Py, Qy, gap, hi, lo, uP, uX, uQ };
        });
        v.readout(() => {
          const { tr, Py, Qy, gap, hi, lo, uP, uX, uQ } = st, f = (x) => v.fix(x, 2);
          if (tr) {
            if (!gap) return Math.abs(P.x - X.x) <= 0.05 ? 'Drag $P$ away from the crossing point $X$.' : 'At this slope the second curve coincides with the first: there is no crossing, and no contradiction.';
            return `$P = (${f(P.x)}, ${f(Py)})$ and $X$ lie on curve 1, and $X$ and $Q = (${f(P.x)}, ${f(Qy)})$ on curve 2, so transitivity forces $P \\sim Q$. But $${hi}$ has ${f(Math.abs(Qy - Py))} more of good 2 and the same good 1 as $${lo}$, so monotonicity gives $${hi} \\succ ${lo}$. Contradiction: two indifference curves through $X$ must be the same curve.`;
          }
          return `With $u = \\sqrt{x_1x_2}$ and indifference meaning $|\\Delta u| \\le \\delta = ${f(del.value)}$: $u(P) = ${f(uP)}$, $u(X) = ${f(uX)}$, $u(Q) = ${f(uQ)}$. So $P \\sim X$ and $X \\sim Q$, yet $|u(Q) - u(P)| = ${f(uQ - uP)} > \\delta$ and $Q \\succ P$. The indifference sets of $P$ and $Q$ are bands that overlap around $X$; that is possible only because this indifference is not transitive.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Definition', name: 'Well-behaved preferences: monotone and convex',
      statement: String.raw`Preferences on $\R^2_+$ are **well behaved** when they are
(a) **monotone**: if $x \ge y$ in both goods then $x \succsim y$, and if $x$ has more of both goods then $x \succ y$ (strongly monotone: $x \ge y$ with $x \ne y$ implies $x \succ y$); and
(b) **convex**: whenever $x \succsim z$ and $y \succsim z$, every mixture $tx + (1-t)y$ with $0 \le t \le 1$ satisfies $tx + (1-t)y \succsim z$, i.e. every weakly preferred set $\{x : x \succsim z\}$ is a convex set. They are **strictly convex** if $x \sim y$, $x \ne y$ and $0 < t < 1$ imply $tx + (1-t)y \succ y$.
Monotonicity makes indifference curves slope downward and rules out thick curves; convexity makes them bow toward the origin, so averages are weakly preferred to extremes. A utility function represents convex preferences exactly when it is quasi-concave.`,
      idea: String.raw`If more is better, a bundle with more of good 1 and the same good 2 is strictly better, so to stay indifferent the second coordinate must fall: indifference curves slope down, and none can be thick, since a thick band would contain two bundles one of which has more of both. Convexity is a statement about segments (Rudin 2.17): the segment between two bundles of an upper contour set stays in it. For two bundles $A$, $B$ on one indifference curve, the function $t \mapsto u(tA + (1-t)B)$ is then never below $u(A)$; with concave curves it dips below in the middle, and the mixtures are worse than either extreme.`,
      caption: String.raw`Drag $A$; the gold bundle $B$ stays on $A$'s indifference curve (drag it along). The segment $AB$ is green where its bundles are at least as good as $A$ and red where they are worse, and the slider moves the mixture $C$. On the right, $u$ along the segment is compared with $u(A)$. The dashed box marks the bundles with more of both goods than $A$; any part of it that is *not* strictly better is painted red, which signals a failure of monotonicity. Try concave curves, thick curves and satiation.`,
      deps: ['micro-4.4', 'pma-2.17'], refs: ['Varian Ch. 3'], tags: ['preferences', 'convexity'],
      see: ['opt-2.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convex_preferences' },
      viz(v) {
        const base = (x, y) => Math.sqrt(Math.max(x, 0) * Math.max(y, 0)), c1 = 3, c2 = 4.2;
        const thick = { u: (x, y) => { const c = base(x, y); return c < c1 ? c : c < c2 ? c1 : c - (c2 - c1); }, ray: false };
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd') },
          subs: { label: 'perfect substitutes', F: prefs('subs') },
          concave: { label: 'concave curves', F: prefs('concave') },
          thick: { label: 'thick curves', F: thick },
          sat: { label: 'satiation', F: prefs('sat', { bx: 6.2, by: 6.4 }) },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const tS = v.slider('mixture weight $t$ on $A$', 0, 1, 0.5, { step: 0.01 });
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 380, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.3 });
        const g = v.stage({ x: [0, 1], y: [0, 1], height: 380, axes: 'box', xlabel: 't', title: 'utility along the segment, $u(tA + (1-t)B)$' });
        const box = (x, y) => [clamp(x, 0.2, 9.8), clamp(y, 0.2, 9.8)];
        const snap = (k, ax, ay, x, y) => {
          const F = FAM[k].F; [x, y] = box(x, y);
          if (k === 'thick') { const c = base(ax, ay), w = base(x, y) || 1e-9; return [x * (c / w), y * (c / w)]; }
          if (k === 'sat') { const [bx, by] = F.bliss, r = Math.hypot(ax - bx, ay - by), d = Math.hypot(x - bx, y - by) || 1e-9; return [bx + ((x - bx) * r) / d, by + ((y - by) * r) / d]; }
          return onRay(F, F.u(ax, ay), x, y) || [x, y];
        };
        const A = s.handle(2.4, 6.2, { color: 'accent', label: 'A', labelPos: 'nw', constrain: box });
        const Bh = s.handle(7, 2.4, { color: 'gold', label: 'B', labelPos: 'se', constrain: (x, y) => snap(fam.value, A.x, A.y, x, y) });
        v.legend([['purple', 'indifference set of A'], ['green', 'at least as good as A'], ['red', 'worse than A / monotonicity fails'], ['gold', 'mixture C', { dot: true }]]);
        let st = {};
        v.render(() => {
          const k = fam.value, F = FAM[k].F, u = F.u, uA = u(A.x, A.y), eps = 1e-9 * Math.max(1, Math.abs(uA));
          [Bh.x, Bh.y] = snap(k, A.x, A.y, Bh.x, Bh.y);
          const gC = v.rgb('green'), rC = v.rgb('red');
          s.raster((x, y) => {
            const w = u(x, y), ne = x >= A.x && y >= A.y && (x - A.x) + (y - A.y) > 0.06;
            if (ne && w <= uA + eps) return [rC[0], rC[1], rC[2], 105];
            return w >= uA - eps ? [gC[0], gC[1], gC[2], 36] : null;
          }, { key: `${k}|${A.x}|${A.y}|${gC}${rC}`, res: 2 });
          s.line(A.x, A.y, 10, A.y, { color: 'orange', width: 1.2, dash: [5, 4] }); s.line(A.x, A.y, A.x, 10, { color: 'orange', width: 1.2, dash: [5, 4] });
          s.text('more of both than A', Math.min(A.x + 0.2, 7.6), Math.min(A.y + 0.45, 9.6), { color: 'orange', size: 11, align: 'left' });
          if (k === 'thick' && base(A.x, A.y) >= c1 && base(A.x, A.y) <= c2) {
            const pts = []; for (let i = 0; i <= 80; i++) { const x = 0.2 + (9.8 * i) / 80; pts.push([x, Math.min(11, (c1 * c1) / x)]); } for (let i = 80; i >= 0; i--) { const x = 0.2 + (9.8 * i) / 80; pts.push([x, Math.min(11, (c2 * c2) / x)]); }
            s.clip(() => s.poly(pts, { fill: 'purple', fillAlpha: 0.22, color: 'purple', width: 1.6 }));
            s.text('one thick indifference set', 8.6, 3.6 ** 2 / 8.6, { color: 'purple', size: 11.5, weight: 600, align: 'center', dy: -2 });
          } else drawLevel(s, F, uA, { color: 'purple', width: 2.6 });
          if (F.bliss) s.dot(...F.bliss, { r: 4.5, color: 'ink', label: 'bliss', labelPos: 'e' });
          // the segment AB, coloured point by point
          const NS = 80, seg = []; let minD = Infinity, tMin = 0;
          for (let i = 0; i <= NS; i++) { const t = i / NS, x = t * A.x + (1 - t) * Bh.x, y = t * A.y + (1 - t) * Bh.y, d = u(x, y) - uA; seg.push([t, x, y, d]); if (i > 0 && i < NS && d < minD) { minD = d; tMin = t; } }
          for (let i = 0; i < NS; i++) { const [, x1, y1, d1] = seg[i], [, x2, y2, d2] = seg[i + 1]; s.line(x1, y1, x2, y2, { color: (d1 + d2) / 2 >= -1e-7 * Math.max(1, Math.abs(uA)) ? 'green' : 'red', width: 4.5, cap: 'butt' }); }
          const t = tS.value, C = [t * A.x + (1 - t) * Bh.x, t * A.y + (1 - t) * Bh.y], uC = u(...C);
          s.dot(...C, { r: 6, color: 'gold', label: 'C', labelPos: 'sw' });
          // monotonicity test on the box of bundles with more of both
          let monoBad = 0, tot = 0;
          for (let i = 0; i <= 14; i++) for (let j = 0; j <= 14; j++) { if (!i && !j) continue; const x = A.x + ((10 - A.x) * i) / 14, y = A.y + ((10 - A.y) * j) / 14; tot++; if (u(x, y) <= uA + eps) monoBad++; }
          // right panel
          const vals = seg.map((q) => q[3] + uA), lo = Math.min(uA, ...vals), hi = Math.max(uA, ...vals), pad = Math.max(0.08 * (hi - lo), 0.05 * Math.max(1, Math.abs(uA)));
          g.setView([0, 1], [lo - pad, hi + pad]);
          const phi = (tt) => u(tt * A.x + (1 - tt) * Bh.x, tt * A.y + (1 - tt) * Bh.y);
          g.between(phi, () => uA, 0, 1, { fill: 'green', fillAlpha: 0.2 });
          g.between(() => uA, (tt) => Math.max(phi(tt), lo - pad), 0, 1, { fill: 'red', fillAlpha: 0.22 });
          g.hline(uA, { color: 'purple', width: 1.6, dash: [6, 4] }); g.text('u(A) = u(B)', 0.5, uA, { dy: -9, align: 'center', color: 'purple', size: 11.5 });
          g.fn(phi, { domain: [0, 1], color: 'ink', width: 2.4, n: 160 });
          g.vline(t, { color: 'gold', width: 1.4 }); g.dot(t, uC, { r: 5.5, color: 'gold', label: 'C', labelPos: 'ne' });
          g.text('B', 0.015, uA, { dy: 12, color: 'muted', size: 12, weight: 700 }); g.text('A', 0.985, uA, { dy: 12, align: 'right', color: 'muted', size: 12, weight: 700 });
          st = { k, uA, uC, minD, tMin, monoBad, tot, C };
        });
        v.readout(() => {
          const { k, uA, uC, minD, monoBad, tot, C } = st, f = (x) => v.fix(x, 2), tol = 1e-6 * Math.max(1, Math.abs(uA));
          const mono = monoBad === 0 ? 'monotone ✓ (every sampled bundle with more of both is strictly better)' : `**not monotone** ✗: ${monoBad} of ${tot} sampled bundles with more of both goods are ${k === 'thick' ? 'no better (a thick indifference set)' : 'worse (beyond the bliss point)'}`;
          const conv = minD < -tol ? `**not convex** ✗: along the segment $u$ dips to ${f(uA + minD)} < u(A) = ${f(uA)}, so mixtures are worse than the extremes` : minD > tol ? `strictly convex ✓: every interior mixture beats the extremes (smallest gain ${f(minD)})` : 'convex but not strictly ✓: the mixtures are exactly as good as $A$ and $B$';
          return `$C = (${f(C[0])}, ${f(C[1])})$ has $u(C) = ${f(uC)}$ against $u(A) = ${f(uA)}$. These preferences are ${mono}; and ${conv}.`;
        });
      },
    },
  ],
};
