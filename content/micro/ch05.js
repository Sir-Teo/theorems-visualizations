// Microeconomics — Chapter 5: Optimal choice and demand (items 5.1–5.8; 5.9–5.15 in ch05-b.js)
import { clamp, GUIDE, argmax, bisect, prefs, numGrad, demand, drawLevel, tangent, pxArrow, budget, nearestOnSegment } from './ch05.shared.js';

const LBL = { size: 12, weight: 700 };
const SUB = (n) => String(n).split('').map((d) => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('');

export default {
  collection: 'micro',
  chapter: 5,
  title: 'Optimal choice and demand',
  summary: String.raw`This chapter joins the two halves of the consumer's problem. A best affordable bundle exists because the budget set is compact. For well-behaved preferences it sits where an indifference curve just touches the budget line, so the marginal rate of substitution equals the price ratio, or equivalently every good bought yields the same marginal utility per dollar. Lagrange multipliers turn this tangency into equations, and Kuhn–Tucker conditions handle corners. Demand functions record how the optimum moves with prices and income: offer curves, Engel curves and demand curves. Minimizing the expenditure needed to reach a utility level is the dual problem; it gives Hicksian demand, the expenditure function and Roy's identity, and it explains why an income tax costs the consumer less than a quantity tax raising the same revenue.`,
  items: [
    // ------------------------------------------------------------------ 5.1
    {
      num: '5.1', kind: 'Theorem', name: 'Existence of an optimal bundle',
      statement: String.raw`Let preferences on $\R^2_+$ be represented by a continuous utility function $u$; one exists whenever preferences are continuous (4.8). If both prices are positive and income is $m \ge 0$, the consumer's problem
$$\max\ u(x_1, x_2) \quad\text{subject to}\quad p_1x_1 + p_2x_2 \le m,\quad x_1, x_2 \ge 0$$
has a solution: some affordable bundle $x^*$ has $u(x^*) \ge u(x)$ for every affordable $x$. If preferences are strictly convex the solution is unique, and if they are locally non-satiated (for example monotone) every solution lies on the budget line, so all income is spent. The hypotheses on the budget set matter. If a price is zero the set is unbounded, and if the constraint is strict ($p \cdot x < m$) the set is not closed; in either case a best bundle can fail to exist.`,
      idea: String.raw`With positive prices the budget set is closed, since it is cut out by weak inequalities between continuous functions. It is also bounded, since it lies inside the box $[0, m/p_1] \times [0, m/p_2]$. By the Heine–Borel theorem (Rudin 2.41) it is compact, and a continuous function on a nonempty compact set attains its maximum (Rudin 4.16). The proof runs as follows: pick affordable bundles $x_n$ with $u(x_n) \to \sup u$; a subsequence converges; the limit is affordable because the set is closed; and continuity carries the values to the limit. If two different bundles were both best, strict convexity would make their midpoint, which is also affordable, strictly better. If a best bundle were strictly inside the set, non-satiation would supply a better bundle nearby that is still affordable.`,
      caption: String.raw`Choose a budget set. The gold points $x_n$ are the best bundles on finer and finer grids of candidates (the faint dots show the grid while it is coarse), and the right panel plots their utility. Drag the gold candidate $Z$. The green region is every affordable bundle that beats it. For the compact set it vanishes exactly at the best bundle $x^*$ ($Z$ snaps onto it when close). With a strict inequality or a free good it never vanishes, because there is always something better.`,
      deps: ['micro-4.1', 'micro-4.8', 'pma-4.16', 'pma-2.41'], refs: ['Varian Ch. 5'], tags: ['optimization', 'existence'],
      see: ['opt-4.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Utility_maximization_problem' },
      viz(v) {
        const m = 12, F = prefs('cd', { a: 0.45 }), u = F.u;
        const mode = v.select('budget set', [{ value: 'closed', label: 'compact: $p\\cdot x \\le m$' }, { value: 'open', label: 'not closed: $p\\cdot x < m$' }, { value: 'free', label: 'unbounded: $p_2 = 0$' }], 'closed');
        const p1 = v.slider('price $p_1$', 0.6, 3, 1.2, { step: 0.05 });
        const p2 = v.slider('price $p_2$', 0.6, 3, 1.5, { step: 0.05 });
        const N = v.slider('search depth $n$', 1, 12, 6, { int: true });
        const s = v.stage({ x: [0, 12.5], y: [0, 12.5], height: 380, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.25 });
        const g = v.stage({ x: [0.4, 12.6], y: [0, 1], height: 380, axes: 'box', xlabel: 'search depth n', ylabel: 'u(xₙ)', title: 'utility of the best grid bundle' });
        const P = () => { const k = mode.value; return [k, p1.value, k === 'free' ? 0 : p2.value]; };
        const inSet = (k, x, y, P1, P2) => x >= 0 && y >= 0 && (k === 'free' ? P1 * x <= m + 1e-12 : k === 'open' ? P1 * x + P2 * y < m - 1e-12 : P1 * x + P2 * y <= m + 1e-12);
        const fit = (x, y) => {
          const [k, P1, P2] = P(); x = clamp(x, 0.05, 12.3); y = clamp(y, 0.05, 12.3);
          if (k === 'free') return [Math.min(x, m / P1), y];
          const c = P1 * x + P2 * y, cap = k === 'open' ? 0.99 * m : m;
          if (c > cap) { x *= cap / c; y *= cap / c; }
          if (k === 'closed') { const xs = F.dem(P1, P2, m); if (Math.hypot(s.X(x) - s.X(xs[0]), s.Y(y) - s.Y(xs[1])) < 12) return xs; }
          return [x, y];
        };
        const Z = s.handle(2.4, 2.2, { color: 'gold', label: 'Z', labelPos: 'sw', constrain: fit });
        /** Best bundle on the grid of spacing H/2^n (columns x1 = ih; in each column the highest affordable grid point). */
        const search = (k, P1, P2, n) => {
          const H = m / P1, h = H / 2 ** n;
          if (k === 'free') return [H, h * Math.round((3 * 2 ** (n / 2)) / h)];
          let best = null, bu = -1;
          for (let i = 0; i <= 2 ** n; i++) {
            const x = i * h, rest = m - P1 * x; if (rest < -1e-12) break;
            const j = k === 'open' ? Math.ceil(rest / (P2 * h) - 1e-9) - 1 : Math.floor(rest / (P2 * h) + 1e-9);
            if (j < 0) continue;
            const w = u(x, j * h); if (w > bu) { bu = w; best = [x, j * h]; }
          }
          return best;
        };
        let st = {};
        v.render(() => {
          const [k, P1, P2] = P(), n = N.value, H = m / P1;
          p2.el.hidden = k === 'free';
          // the budget set
          if (k === 'free') {
            s.rect(0, 0, H, 12.5, { fill: 'accent', fillAlpha: 0.1, stroke: false });
            s.line(H, 0, H, 12.5, { color: 'accent', width: 2.8 });
            for (const xa of [0.3 * H, 0.7 * H]) s.arrow(xa, 10.6, xa, 12.3, { color: 'accent', width: 2, head: 9 });
            s.text('the set goes on forever', 0.5 * H, 11.4, { color: 'accent', ...LBL, align: 'center' });
          } else {
            s.clip(() => s.poly([[0, 0], [H, 0], [0, m / P2]], { fill: 'accent', fillAlpha: 0.1, stroke: false }));
            s.clip(() => s.line(H, 0, 0, m / P2, { color: 'accent', width: k === 'open' ? 2 : 2.8, dash: k === 'open' ? [7, 6] : null }));
            if (k === 'open') { const xl = 0.62 * H, yl = (m - P1 * xl) / P2; if (yl < 12) s.text('edge excluded', xl, yl, { dx: 8, dy: -10, color: 'accent', ...LBL, align: 'left' }); }
          }
          // affordable bundles better than Z
          const uZ = u(Z.x, Z.y), gc = v.rgb('green');
          s.raster((x, y) => (inSet(k, x, y, P1, P2) && u(x, y) > uZ + 1e-9 ? [gc[0], gc[1], gc[2], 92] : null), { key: `${k}|${P1}|${P2}|${uZ}|${gc}`, res: 2 });
          drawLevel(s, F, uZ, { color: 'purple', width: 2 });
          // the grid of candidates while it is coarse, and the search sequence
          const h = H / 2 ** n;
          if (h * s.scale > 9 && k !== 'free') { const pts = []; for (let i = 0; i * h <= H + 1e-9; i++) for (let j = 0; j * h <= 12.5; j++) if (inSet(k, i * h, j * h, P1, P2)) pts.push([i * h, j * h]); s.dots(pts, { r: 2.2, color: 'muted', alpha: 0.7 }); }
          const seq = []; for (let i = 1; i <= 12; i++) seq.push(search(k, P1, P2, i));
          const shown = seq.slice(0, n), vis = shown.filter((q) => q[1] <= 12.4);
          s.path(vis, { color: 'gold', width: 1.4, alpha: 0.7 });
          vis.forEach((q, i) => { if (i < vis.length - 1) s.dot(q[0], q[1], { r: 3.4, color: 'gold' }); });
          const last = shown[n - 1];
          if (last[1] <= 12.4) s.dot(last[0], last[1], { r: 5.5, color: 'gold', label: `x${SUB(n)}`, labelPos: k === 'open' ? 'sw' : 'ne', math: false });
          else s.text(`x${n} = (${v.fix(last[0], 1)}, ${v.fix(last[1], 0)}) is off the chart ↑`, H, 12.2, { dx: -8, color: 'gold', ...LBL, align: 'right', baseline: 'top' });
          let xs = null;
          if (k !== 'free') {
            xs = F.dem(P1, P2, m);
            if (k === 'closed') s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
            else { s.dot(xs[0], xs[1], { r: 6.5, hollow: true, color: 'red', width: 2.4 }); s.text('limit: not affordable', xs[0], xs[1], { dx: 11, dy: -12, color: 'red', ...LBL, align: 'left' }); }
          }
          // share of the budget set that beats Z (grid estimate)
          let cnt = 0, tot = 0;
          if (k !== 'free') { const Y = m / P2; for (let i = 0; i < 70; i++) for (let j = 0; j < 70; j++) { const x = ((i + 0.5) * H) / 70, y = ((j + 0.5) * Y) / 70; if (!inSet(k, x, y, P1, P2)) continue; tot++; if (u(x, y) > uZ + 1e-9) cnt++; } }
          // right panel: utility of the search sequence
          const vals = seq.map((q) => u(q[0], q[1])), uStar = xs ? u(xs[0], xs[1]) : null;
          if (k === 'free') g.setScale({ ylog: true, y: [2, 120] });
          else { const lo = Math.min(...vals), hi = uStar; g.setScale({ ylog: false, y: [Math.max(0, lo - 0.35 * (hi - lo)), hi + 0.25 * (hi - lo)] }); }
          g.setLabels(undefined, k === 'free' ? 'u(xₙ)  (log scale)' : 'u(xₙ)');
          if (uStar != null) {
            g.hline(uStar, { color: k === 'closed' ? 'green' : 'red', width: 1.8, dash: [6, 4] });
            g.text(k === 'closed' ? `max u = ${v.fix(uStar, 3)}, attained at x*` : `sup u = ${v.fix(uStar, 3)}, never reached`, 12.3, uStar, { dy: -10, color: k === 'closed' ? 'green' : 'red', ...LBL, align: 'right' });
          } else g.text('no upper bound', 12.3, 110, { dy: 6, color: 'red', ...LBL, align: 'right', baseline: 'top' });
          const pts = vals.map((w, i) => [i + 1, w]);
          g.path(pts, { color: 'gold', width: 1.2, alpha: 0.35, dash: [3, 3] });
          g.path(pts.slice(0, n), { color: 'gold', width: 2.2 });
          pts.forEach(([x, w], i) => g.dot(x, w, { r: i === n - 1 ? 6 : 3.4, color: 'gold', alpha: i < n ? 1 : 0.35 }));
          st = { k, P1, P2, n, xs, uStar, un: vals[n - 1], last, uZ, cnt, tot, unspent: m - P1 * Z.x - P2 * Z.y };
        });
        v.readout(() => {
          const { k, n, xs, uStar, un, last, uZ, cnt, tot, unspent } = st, f = (x) => v.fix(x, 2), f3 = (x) => v.fix(x, 3);
          const zt = k !== 'free' && cnt === 0 ? ` Nothing affordable beats $Z$: it is a best bundle.` : k === 'free' ? ` Above any $Z$ there are better free bundles, so the green region never disappears.` : ` About ${v.fix((100 * cnt) / tot, 0)}% of the budget set beats $Z$ (green), with $u(Z) = ${f3(uZ)}$.`;
          if (k === 'closed') return `The budget set is closed and bounded, so it is compact, and $u = x_1^{0.45}x_2^{0.55}$ is continuous: a best bundle exists, $x^* = (${f(xs[0])}, ${f(xs[1])})$ with $u(x^*) = ${f3(uStar)}$. The grid search has reached $u(x_{${n}}) = ${f3(un)}$, and its limit $x^*$ is affordable.${zt}`;
          if (k === 'open') return `The set $\\{p\\cdot x < m\\}$ is bounded but not closed: the budget line itself is excluded. The search values climb toward $\\sup u = ${f3(uStar)}$ ($u(x_{${n}}) = ${f3(un)}$) but never reach it, because their limit $x^*$ lies on the excluded line. Every affordable bundle leaves money unspent (here ${f(unspent)} at $Z$), and spending a little of it is an improvement: no best bundle exists.${zt}`;
          return `With $p_2 = 0$ good 2 is free, and the budget set is the strip $0 \\le x_1 \\le m/p_1$: closed but unbounded. The search finds ever better bundles, $x_{${n}} = (${f(last[0])}, ${v.fix(last[1], 0)})$ with $u = ${f3(un)}$, and utility has no upper bound on the set: no best bundle exists.${zt}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.2
    {
      num: '5.2', kind: 'Principle', name: 'Tangency condition: MRS equals the price ratio',
      statement: String.raw`Let $u$ be differentiable with positive marginal utilities, and let the best affordable bundle $x^*$ have both coordinates positive. Then the indifference curve through $x^*$ is tangent to the budget line there:
$$\mathrm{MRS}(x^*) = \frac{MU_1(x^*)}{MU_2(x^*)} = \frac{p_1}{p_2}.$$
The rate at which the consumer is willing to trade the goods equals the rate at which the market lets them trade. Together with the budget equation $p_1x_1 + p_2x_2 = m$ this gives two equations for the two unknowns. The condition is necessary. It is also sufficient when preferences are convex, but not otherwise: with concave indifference curves a point of tangency is the *worst* bundle on the budget line.`,
      idea: String.raw`Walk along the budget line, $x_2 = (m - p_1x_1)/p_2$. Utility along the walk is a function of $x_1$ alone with derivative $MU_1 - MU_2\,p_1/p_2 = MU_2\,(\mathrm{MRS} - p_1/p_2)$ (chain rule). At an interior maximum this derivative vanishes (Rudin 5.8), which is the tangency condition. Economically, if $\mathrm{MRS} > p_1/p_2$ the consumer values one more unit of good 1 at more units of good 2 than the market charges, so buying more good 1 helps; if $\mathrm{MRS} < p_1/p_2$, buying less helps. Convexity makes the MRS fall along the line, so the derivative changes sign only once, from $+$ to $-$, and the stationary point is a maximum. With concave curves the MRS rises along the line, the sign changes from $-$ to $+$, and the tangency is a minimum.`,
      caption: String.raw`Drag the gold bundle $B$ along the budget line, or change the prices. The dashed purple line is tangent to the indifference curve through $B$ and has slope $-\mathrm{MRS}$; the green arrow points the way utility rises along the budget line. The right panel plots utility along the line, and the bottom panel plots the MRS against the price ratio, where the sign of the gap gives the direction of the arrow. The peak is where they cross. Switch to **concave curves**: the crossing becomes the lowest point and the best bundle jumps to a corner.`,
      deps: ['micro-5.1', 'micro-4.11', 'pma-5.8'], refs: ['Varian Ch. 5', 'Mankiw Ch. 21'], tags: ['optimization'],
      see: ['micro-1.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginal_rate_of_substitution' },
      viz(v) {
        const m = 12;
        const FAM = { cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }) }, ces: { label: 'CES, $\\sigma = \\tfrac12$', F: prefs('ces', { a: 0.5, r: -1 }) }, concave: { label: 'concave curves', F: prefs('concave') } };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const p1 = v.slider('price $p_1$', 0.6, 3, 1.5, { step: 0.05 });
        const p2 = v.slider('price $p_2$', 0.6, 3, 1, { step: 0.05 });
        const s = v.stage({ x: [0, 14], y: [0, 14], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.1 });
        const g = v.stage({ x: [0, 1], y: [0, 1], height: 360, axes: 'box', xlabel: 'x₁ (moving along the budget line)', ylabel: 'u', title: 'utility along the budget line' });
        const r = v.stage({ x: [0, 1], y: [0, 3], height: 175, axes: 'box', full: true, xlabel: 'x₁ (moving along the budget line)', ylabel: 'rate', title: 'the MRS at each point of the line, against the price ratio $p_1/p_2$' });
        let tB = 0.22;
        const B = s.handle(2, 9, { color: 'gold', label: 'B', labelPos: 'sw', constrain: (x, y) => { const q = nearestOnSegment(s, [0, m / p2.value], [m / p1.value, 0], x, y); tB = clamp(q[2], 0.01, 0.99); return [q[0], q[1]]; } });
        v.legend([['accent', 'budget line'], ['purple', 'indifference curve through B'], ['purple', 'its tangent, slope −MRS', { dash: true }], ['green', 'best bundle', { dot: true }]]);
        let st = {};
        v.render(() => {
          const o = FAM[fam.value], F = o.F, P1 = p1.value, P2 = p2.value, X1 = m / P1, X2 = m / P2, k = P1 / P2;
          B.x = tB * X1; B.y = (1 - tB) * X2;
          for (const t of [2, 4, 6, 8, 10, 12]) drawLevel(s, F, F.u(t, t), { color: v.color('purple', 0.22), width: 1 });
          budget(s, P1, P2, m);
          const xs = F.dem(P1, P2, m), uB = F.u(B.x, B.y);
          drawLevel(s, F, uB, { color: 'purple', width: 2.6 });
          const [g1, g2] = F.grad(B.x, B.y), mrs = g1 / g2, gap = mrs - k;
          s.clip(() => tangent(s, B.x, B.y, -mrs, 95, { color: 'purple', width: 2, dash: [6, 4] }));
          if (Math.abs(gap) > 0.012 * k) pxArrow(s, B.x, B.y, gap > 0 ? X1 : -X1, gap > 0 ? -X2 : X2, 44, { color: 'green', width: 3, head: 10 });
          let tg = null;
          if (fam.value === 'concave') { const d = P1 * P1 + P2 * P2; tg = [(P1 * m) / d, (P2 * m) / d]; s.dot(tg[0], tg[1], { r: 6, hollow: true, color: 'red', width: 2.4 }); s.text('tangency = worst point', tg[0], tg[1], { dx: 10, dy: -11, color: 'red', ...LBL, align: 'left' }); }
          s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: 'x*', labelPos: xs[1] < 1 ? 'n' : 'ne' });
          // utility along the line
          const along = (x) => F.u(x, (m - P1 * x) / P2), us = []; for (let i = 0; i <= 200; i++) us.push(along((X1 * i) / 200));
          const lo = Math.min(...us), hi = Math.max(...us), pd = 0.12 * (hi - lo || 1);
          g.setView([0, X1], [lo - pd, hi + 1.6 * pd]);
          g.fn(along, { domain: [0, X1], color: 'ink', width: 2.6, n: 240 });
          g.line(B.x, lo - pd, B.x, uB, GUIDE); g.dot(B.x, uB, { r: 6, color: 'gold', label: 'B', labelPos: 'nw' });
          g.dot(xs[0], F.u(xs[0], xs[1]), { r: 6.5, color: 'green', label: 'x*', labelPos: xs[0] > 0.8 * X1 ? 'nw' : 'ne' });
          if (tg) g.dot(tg[0], along(tg[0]), { r: 6, hollow: true, color: 'red', width: 2.4, label: 'tangency', labelPos: 's', labelColor: 'red' });
          // MRS along the line against the price ratio
          const mr = (x) => { const [a1, a2] = F.grad(x, (m - P1 * x) / P2); return a1 / a2; };
          const top = 3 * k; r.setView([0, X1], [0, top]);
          const cap = (x) => clamp(mr(x), 0, top * 1.05), eps = X1 * 2e-3;
          r.between((x) => Math.max(cap(x), k), () => k, eps, X1 - eps, { fill: 'green', fillAlpha: 0.16, n: 300 });
          r.between(() => k, (x) => Math.min(cap(x), k), eps, X1 - eps, { fill: 'red', fillAlpha: 0.12, n: 300 });
          r.hline(k, { color: 'accent', width: 2.2 });
          r.text(`p₁/p₂ = ${v.fix(k, 2)}`, X1, k, { dx: -8, dy: -10, color: 'accent', ...LBL, align: 'right' });
          r.clip(() => r.fn(mr, { domain: [eps, X1 - eps], color: 'purple', width: 2.6, n: 300 }));
          const conc = fam.value === 'concave';
          r.text(conc ? 'MRS < p₁/p₂: move left' : 'MRS > p₁/p₂: buy more good 1', conc ? 0.03 * X1 : 0.03 * X1, conc ? 0.45 * k : 2.6 * k, { color: conc ? 'red' : 'green', size: 11.5, weight: 600, align: 'left' });
          r.text(conc ? 'MRS > p₁/p₂: move right' : 'MRS < p₁/p₂: buy less good 1', 0.97 * X1, conc ? 2.6 * k : 0.45 * k, { color: conc ? 'green' : 'red', size: 11.5, weight: 600, align: 'right' });
          r.line(B.x, 0, B.x, clamp(mrs, 0, top), GUIDE); if (mrs <= top) r.dot(B.x, mrs, { r: 6, color: 'gold' });
          st = { o, P1, P2, k, xs, uB, mrs, gap, g2, tg, conc };
        });
        v.readout(() => {
          const { k, xs, mrs, gap, g2, tg, conc } = st, f = (x) => v.fix(x, 2);
          const dir = Math.abs(gap) <= 0.012 * k ? 'so $B$ is (almost) at the tangency' : gap > 0 ? `so moving **right** along the line raises utility: $du/dx_1 = MU_2(\\mathrm{MRS} - p_1/p_2) = ${f(g2 * gap)} > 0$` : `so moving **left** along the line raises utility: $du/dx_1 = MU_2(\\mathrm{MRS} - p_1/p_2) = ${f(g2 * gap)} < 0$`;
          const head = `At $B = (${f(B.x)}, ${f(B.y)})$ the consumer would give up $\\mathrm{MRS} = ${f(mrs)}$ units of good 2 for one more unit of good 1, while the market charges $p_1/p_2 = ${f(k)}$, ${dir}.`;
          if (conc) return `${head} The curves are concave here: the MRS *rises* along the line, so the tangency at $(${f(tg[0])}, ${f(tg[1])})$ is the worst bundle on the line, and the best one is the corner $x^* = (${f(xs[0])}, ${f(xs[1])})$, where the MRS and the price ratio differ.`;
          return `${head} The best bundle $x^* = (${f(xs[0])}, ${f(xs[1])})$ is where the MRS falls to the price ratio: there $\\mathrm{MRS} = p_1/p_2 = ${f(k)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.3
    {
      num: '5.3', kind: 'Principle', name: 'Equimarginal principle',
      statement: String.raw`At a best affordable bundle the last dollar spent on each good yields the same marginal utility: for every good bought in positive quantity,
$$\frac{MU_1}{p_1} = \frac{MU_2}{p_2} = \cdots = \frac{MU_n}{p_n} = \lambda,$$
and a good that is not bought at all has $MU_i/p_i \le \lambda$. The common value $\lambda$ is the marginal utility of money. With two goods this is the tangency condition $\mathrm{MRS} = p_1/p_2$ rewritten. The principle assumes differentiable utility, goods that can be bought in small amounts, and that all income is spent.`,
      idea: String.raw`If $MU_1/p_1 > MU_2/p_2$, moving one dollar from good 2 to good 1 loses about $MU_2/p_2$ units of utility and gains about $MU_1/p_1$, a net gain, so the bundle was not optimal. Only when the ratios are equal is no such reallocation profitable. Diminishing marginal utility is what makes the greedy procedure work: spend each successive dollar on the good whose next dollar buys the most utility. Each choice lowers that good's ratio, so the ratios are driven toward a common level, which is $\lambda$. The procedure is the discrete version of the Lagrange conditions of 5.4 and of the Kuhn–Tucker conditions of 5.5, since a good whose first dollar earns less than $\lambda$ is never bought.`,
      caption: String.raw`Press play: income is spent one step at a time, each step going to the good whose next dollar adds the most utility. The bars show each good's marginal utility per dollar $MU_i/p_i$ at the current bundle; they level out at the dashed line $\lambda^*$, the exact Lagrange multiplier. The bottom panel records the utility added by every dollar, coloured by the good it bought. The map shows goods 1 and 2: the greedy staircase ends at the tangency $x^*$ on the budget line for the money they receive. Raise $p_3$ until good 3 is never bought.`,
      deps: ['micro-5.2', 'micro-4.9'], refs: ['Varian Ch. 5'], tags: ['optimization', 'marginal analysis'],
      credit: 'Hermann Heinrich Gossen, 1854 (Gossen’s second law)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equimarginal_principle' },
      viz(v) {
        const A = [4, 2, 3], COL = ['orange', 'teal', 'pink'];
        const goods = v.select('goods', [{ value: 2, label: 'two goods' }, { value: 3, label: 'three goods' }], 3);
        const step = v.select('spend in steps of', [{ value: 2, label: '$\\$2$' }, { value: 1, label: '$\\$1$' }, { value: 0.25, label: '25¢' }], 1);
        const m = v.slider('income $m$', 6, 40, 24, { step: 1 });
        const ps = [v.slider('price $p_1$', 0.5, 4, 2, { step: 0.1 }), v.slider('price $p_2$', 0.5, 4, 1, { step: 0.1 }), v.slider('price $p_3$', 0.5, 6, 2.5, { step: 0.1 })];
        const s = v.stage({ x: [0, 10], y: [0, 10], height: 330, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.05, title: 'goods 1 and 2' });
        const b = v.stage({ x: [0.3, 3.7], y: [0, 1], height: 330, axes: 'box', ylabel: 'MUᵢ / pᵢ', xticks: [[1, 'good 1'], [2, 'good 2'], [3, 'good 3']], title: 'marginal utility per dollar now' });
        const d = v.stage({ x: [0, 24], y: [0, 1], height: 180, axes: 'box', full: true, xlabel: 'dollars spent so far', ylabel: 'utility per $', title: 'what each successive dollar added' });
        v.legend([['orange', 'good 1', { area: true }], ['teal', 'good 2', { area: true }], ['pink', 'good 3', { area: true }], ['green', 'λ* (exact)', { dash: true }]]);
        const PER = 6; // seconds to spend everything
        let st = {};
        v.animate((t) => {
          const n = goods.value, M = m.value, dl = step.value, P = ps.map((q) => q.value).slice(0, n), a = A.slice(0, n);
          ps[2].el.hidden = n < 3;
          // the exact optimum: MU_i/p_i = λ for goods bought, by bisection on λ
          const spend = (lam) => a.reduce((acc, ai, i) => acc + Math.max(0, ai / lam - P[i]), 0);
          const lam = bisect((l) => spend(l) - M, 1e-6, Math.max(...a.map((ai, i) => ai / P[i])), 80);
          const xs = a.map((ai, i) => Math.max(0, ai / (lam * P[i]) - 1));
          // greedy spending, one step of dl dollars at a time
          const NS = Math.round(M / dl), K = Math.min(NS, Math.floor((t / PER) * NS));
          const x = a.map(() => 0), hist = [], path = [[0, 0]];
          for (let j = 0; j < NS; j++) {
            let bi = 0, bg = -1;
            for (let i = 0; i < n; i++) { const gain = (a[i] * Math.log((1 + x[i] + dl / P[i]) / (1 + x[i]))) / dl; if (gain > bg + 1e-12) { bg = gain; bi = i; } }
            if (j >= K) break;
            x[bi] += dl / P[bi]; hist.push([bi, bg]); if (bi < 2) path.push([x[0], x[1]]);
          }
          const mu = a.map((ai, i) => ai / (1 + x[i]) / P[i]);
          // map of goods 1 and 2, with the money they get at the optimum
          const M12 = M - (n > 2 ? P[2] * xs[2] : 0), X1 = M12 / P[0], X2 = M12 / P[1];
          s.setView([0, 1.12 * Math.max(X1, 2)], [0, 1.12 * Math.max(X2, 2)]);
          budget(s, P[0], P[1], M12);
          const L12 = a[0] * Math.log(1 + xs[0]) + a[1] * Math.log(1 + xs[1]);
          s.clip(() => s.fn((q) => Math.exp((L12 - a[0] * Math.log(1 + q)) / a[1]) - 1, { domain: [0, 1.2 * X1], color: 'purple', width: 2.4, n: 200 }));
          s.path(path.flatMap((q, i) => (i ? [[q[0], path[i - 1][1]], q] : [q])), { color: 'gold', width: 2.2 });
          s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
          s.dot(x[0], x[1], { r: 5.5, color: 'gold' });
          if (n > 2) s.corner(`budget line: the $${v.fix(M12, 2)} left after good 3`, 'tr', { color: 'accent', weight: 600 });
          // bars of MU/p
          const top = Math.max(...a.map((ai, i) => ai / P[i]), lam) * 1.12;
          b.setView([0.3, n + 0.7], [0, top]); b.setTicks(a.map((_, i) => [i + 1, `good ${i + 1}`]), undefined);
          a.forEach((_, i) => {
            b.rect(i + 0.72, 0, i + 1.28, mu[i], { fill: COL[i], fillAlpha: 0.7, color: COL[i], width: 1.2, radius: 4 });
            b.text(v.fix(mu[i], 3), i + 1, mu[i], { dy: -10, align: 'center', color: COL[i], ...LBL });
            b.text(`x${'₁₂₃'[i]} = ${v.fix(x[i], 2)}`, i + 1, 0, { dy: -12, align: 'center', size: 11.5, weight: 600 });
          });
          b.hline(lam, { color: 'green', width: 2, dash: [6, 4] }); b.text(`λ* = ${v.fix(lam, 3)}`, n + 0.66, lam, { dy: -10, align: 'right', color: 'green', ...LBL });
          // utility added by each step
          d.setView([0, M], [0, top]);
          hist.forEach(([i, gn], j) => d.rect(j * dl, 0, (j + 1) * dl, gn, { fill: COL[i], fillAlpha: 0.75, stroke: false }));
          d.hline(lam, { color: 'green', width: 2, dash: [6, 4] });
          const U = (q) => a.reduce((acc, ai, i) => acc + ai * Math.log(1 + q[i]), 0);
          st = { n, M, K, NS, dl, x, xs, lam, mu, done: K >= NS, ug: U(x), us: U(xs), a, P };
        }, { period: PER + 1.2, once: true, still: PER + 1.2 });
        v.readout(() => {
          const { n, M, K, dl, x, xs, lam, mu, done, ug, us, a, P } = st, f = (q) => v.fix(q, 2);
          const ratios = mu.map((q, i) => `$MU_${i + 1}/p_${i + 1} = ${v.fix(q, 3)}$`).join(', ');
          if (!done) return `Spent $\\$${f(K * dl)}$ of $\\$${M}$; bundle (${x.map(f).join(', ')}). Now ${ratios}: the next dollar goes to the good with the tallest bar.`;
          const skip = xs.map((q, i) => (q === 0 ? i : -1)).filter((i) => i >= 0);
          const corner = skip.length ? ` Good ${skip.map((i) => i + 1).join(', ')} is not bought: even its first dollar earns only $a_${skip[0] + 1}/p_${skip[0] + 1} = ${v.fix(a[skip[0]] / P[skip[0]], 3)} < \\lambda^*$.` : '';
          return `All $\\$${M}$ spent in steps of $\\$${dl}$: greedy bundle (${x.map(f).join(', ')}), with ${ratios}, all close to $\\lambda^* = ${v.fix(lam, 3)}$. The exact optimum of $u = ${a.map((ai, i) => `${ai}\\ln(1+x_${i + 1})`).join(' + ')}$ is $x^* = (${xs.map(f).join(', ')})$, with $MU_i/p_i = \\lambda^*$ for every good bought; utility ${v.fix(ug, 3)} (greedy) against ${v.fix(us, 3)} (exact).${corner}${n === 2 ? '' : ` In the map, goods 1 and 2 still satisfy the tangency condition $\\mathrm{MRS} = p_1/p_2$ on the line of what they receive.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.4
    {
      num: '5.4', kind: 'Method', name: 'Lagrange multipliers for constrained choice',
      statement: String.raw`To maximize a differentiable utility $u(x_1, x_2)$ on the budget line $g(x) = p_1x_1 + p_2x_2 = m$, form the **Lagrangian**
$$\mathcal{L}(x_1, x_2, \lambda) = u(x_1, x_2) - \lambda\,(p_1x_1 + p_2x_2 - m)$$
and solve $\partial\mathcal{L}/\partial x_1 = \partial\mathcal{L}/\partial x_2 = \partial\mathcal{L}/\partial\lambda = 0$, that is
$$\nabla u(x^*) = \lambda\,(p_1, p_2), \qquad p_1x_1^* + p_2x_2^* = m.$$
Every interior optimum solves these equations; for quasi-concave $u$ every solution is an optimum. The multiplier has a meaning: if $v(p, m)$ is the maximal utility at income $m$, then $\lambda = \partial v/\partial m$, the **marginal utility of income**.`,
      idea: String.raw`At the optimum the indifference curve and the budget line are tangent (5.2), so their normals are parallel. The normal of an indifference curve is $\nabla u$ (vcalc 2.8) and the normal of the budget line is $(p_1, p_2)$, so $\nabla u = \lambda p$ for some number $\lambda$; the implicit function theorem (Rudin 9.28) is what turns the constraint into a curve along which this argument works. At any other point of the line, $\nabla u$ has a component *along* the line, which says that sliding that way raises utility. For the meaning of $\lambda$, differentiate $v(m) = u(x^*(m))$: by the chain rule $v'(m) = \nabla u \cdot dx^*/dm = \lambda\, p \cdot dx^*/dm$, and $p \cdot dx^*/dm = 1$ because the extra income is all spent. This is the envelope theorem in its simplest form.`,
      caption: String.raw`Type a utility function or pick a preset. Drag the gold bundle $P$ along the budget line. At $P$ the orange arrow is $\nabla u$, which splits into a part along the normal $(p_1, p_2)$ (blue) and a part along the line (green, the direction in which utility rises). The green part vanishes only at the optimum $x^*$, where $\nabla u = \lambda p$. On the right, maximal utility is plotted against income. Its slope at the current income is $\lambda$ (green tangent), and the gold secant shows what a real income nudge $\Delta m$ buys.`,
      deps: ['micro-5.2', 'pma-9.28', 'vcalc-2.14'], refs: ['Varian Ch. 5'], tags: ['optimization'],
      see: ['opt-1.9', 'vcalc-2.8', 'micro-7.9'],
      credit: 'Joseph-Louis Lagrange, 1788',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lagrange_multiplier' },
      viz(v) {
        const PRE = { cd: ['Cobb–Douglas', 'x1^0.4 x2^0.6'], ces: ['CES', '(sqrt(x1) + sqrt(x2))^2'], ql: ['quasilinear', '3 ln(x1) + x2'], log: ['logs', 'ln(x1 + 1) + 2 ln(x2 + 1)'] };
        let inp = null;
        v.select('preset', Object.entries(PRE).map(([value, [label]]) => ({ value, label })), 'cd', { onChange: (k) => inp.set(PRE[k][1]) });
        inp = v.input('$u(x_1, x_2) =$', PRE.cd[1], { vars: ['x1', 'x2', 'x', 'y'], width: 240 });
        const p1 = v.slider('price $p_1$', 0.5, 3, 1, { step: 0.05 });
        const p2 = v.slider('price $p_2$', 0.5, 3, 1.25, { step: 0.05 });
        const m = v.slider('income $m$', 4, 20, 10, { step: 0.1 });
        const dm = v.slider('income nudge $\\Delta m$', 0.05, 4, 2, { step: 0.05 });
        const s = v.stage({ x: [0, 12], y: [0, 12], height: 390, equal: true, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15 });
        const g = v.stage({ x: [0, 24], y: [0, 1], height: 390, axes: 'box', xlabel: 'income m', ylabel: 'v(p, m)', title: 'maximal utility against income' });
        let tP = 0.15;
        const P = s.handle(1, 8, { color: 'gold', label: 'P', labelPos: 'sw', constrain: (x, y) => { const q = nearestOnSegment(s, [0, m.value / p2.value], [m.value / p1.value, 0], x, y); tP = clamp(q[2], 0.005, 0.995); return [q[0], q[1]]; } });
        v.legend([['orange', '∇u'], ['accent', 'part along the normal (p₁, p₂)'], ['green', 'part along the budget line'], ['purple', 'indifference curves']]);
        const U = () => { const f = inp.fn; return f ? (x, y) => f(x, y, x, y) : (x, y) => x ** 0.4 * y ** 0.6; };
        const best = (u, P1, P2, M) => { const r = argmax((t) => { const w = u((t * M) / P1, ((1 - t) * M) / P2); return isFinite(w) ? w : -1e300; }, 0, 1, 90); return { x: [(r.x * M) / P1, ((1 - r.x) * M) / P2], u: r.f }; };
        let st = {};
        v.render(() => {
          const u = U(), P1 = p1.value, P2 = p2.value, M = m.value, X1 = M / P1, X2 = M / P2;
          P.x = tP * X1; P.y = (1 - tP) * X2;
          const levels = [1.5, 3, 4.5, 6, 7.5, 9, 10.5].map((t) => u(t, t)).filter((w) => isFinite(w));
          s.contour(u, levels, { color: 'purple', alpha: 0.28, width: 1, res: 110 });
          budget(s, P1, P2, M);
          const opt = best(u, P1, P2, M), xs = opt.x;
          s.contour(u, opt.u, { color: 'purple', width: 2.4, res: 130 });
          const uP = u(P.x, P.y); if (Math.abs(uP - opt.u) > 1e-6 * Math.max(1, Math.abs(opt.u))) s.contour(u, uP, { color: 'purple', width: 1.4, dash: [5, 4], res: 130 });
          // the gradient at P and its two components
          const G = numGrad(u, P.x, P.y), Gs = numGrad(u, xs[0], xs[1]), pp = P1 * P1 + P2 * P2;
          const lamP = (G[0] * P1 + G[1] * P2) / pp, Nv = [lamP * P1, lamP * P2], T = [G[0] - Nv[0], G[1] - Nv[1]];
          const kappa = 82 / (s.scale * Math.hypot(...Gs) || 1);
          const tip = (w) => [P.x + kappa * w[0], P.y + kappa * w[1]];
          const [gx, gy] = tip(G), [nx, ny] = tip(Nv), [tx, ty] = tip(T);
          if (Math.hypot(T[0], T[1]) * kappa * s.scale > 4) { s.line(nx, ny, gx, gy, { color: 'muted', width: 1, dash: [3, 3] }); s.line(tx, ty, gx, gy, { color: 'muted', width: 1, dash: [3, 3] }); s.arrow(P.x, P.y, tx, ty, { color: 'green', width: 2.6, head: 9 }); }
          s.arrow(P.x, P.y, nx, ny, { color: 'accent', width: 2.6, head: 9 });
          s.arrow(P.x, P.y, gx, gy, { color: 'orange', width: 3, head: 10 });
          s.text('∇u', gx, gy, { dx: 7, dy: -7, color: 'orange', ...LBL, align: 'left' });
          s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
          const ang = (Math.acos(clamp((G[0] * P1 + G[1] * P2) / (Math.hypot(...G) * Math.sqrt(pp)), -1, 1)) * 180) / Math.PI;
          // maximal utility against income
          const ms = []; for (let i = 0; i <= 60; i++) ms.push(0.3 + (23.7 * i) / 60);
          const vs = ms.map((q) => best(u, P1, P2, q).u), vm = opt.u, v2 = best(u, P1, P2, M + dm.value).u;
          const lo = Math.min(...vs.filter(isFinite)), hi = Math.max(...vs.filter(isFinite)), pd = 0.08 * (hi - lo || 1);
          g.setView([0, 24], [lo - pd, hi + pd]);
          g.path(ms.map((q, i) => [q, vs[i]]), { color: 'ink', width: 2.4 });
          const lam = Gs[0] / P1, h = 1e-3, lamFD = (best(u, P1, P2, M + h).u - best(u, P1, P2, M - h).u) / (2 * h);
          g.clip(() => g.line(M - 5, vm - 5 * lam, M + 5, vm + 5 * lam, { color: 'green', width: 2.2 }));
          g.line(M, vm, M + dm.value, vm, { color: 'gold', width: 1.6 }); g.line(M + dm.value, vm, M + dm.value, v2, { color: 'gold', width: 2.4 });
          g.line(M, vm, M + dm.value, v2, { color: 'gold', width: 1.4, dash: [4, 3] });
          g.dot(M + dm.value, v2, { r: 4.5, color: 'gold' }); g.dot(M, vm, { r: 6, color: 'green' });
          g.text(`slope λ = ${v.fix(lam, 3)}`, M - 2.5, vm - 2.5 * lam, { dx: 8, dy: 8, color: 'green', ...LBL, align: 'left', baseline: 'top' });
          st = { xs, G, Gs, lamP, lam, lamFD, ang, vm, v2, P1, P2, M, T };
        });
        v.readout(() => {
          const { xs, G, Gs, lam, lamFD, ang, vm, v2, P1, P2, M } = st, f = (q) => v.fix(q, 3), D = dm.value;
          const err = inp.error ? ` (Formula error: ${inp.error}; using the last valid formula.)` : '';
          return `At $x^* = (${v.fix(xs[0], 2)}, ${v.fix(xs[1], 2)})$: $\\nabla u = (${f(Gs[0])}, ${f(Gs[1])}) = \\lambda\\,(${v.fix(P1, 2)}, ${v.fix(P2, 2)})$ with $\\lambda = MU_1/p_1 = ${f(Gs[0] / P1)}$ and $MU_2/p_2 = ${f(Gs[1] / P2)}$, so all three Lagrange equations hold. At $P$ the gradient $(${f(G[0])}, ${f(G[1])})$ makes an angle of ${v.fix(ang, 1)}° with $(p_1, p_2)$. Income from ${v.fix(M, 1)} to ${v.fix(M + D, 2)} raises $v$ from ${f(vm)} to ${f(v2)}: $\\Delta v/\\Delta m = ${f((v2 - vm) / D)}$, and with a nudge of 0.001 it is ${f(lamFD)}, matching $\\lambda = ${f(lam)}$: the multiplier is the marginal utility of income.${err}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.5
    {
      num: '5.5', kind: 'Concept', name: 'Corner solutions',
      statement: String.raw`A **corner solution** is a best affordable bundle in which some good is not bought at all. There the tangency condition need not hold; it is replaced by an inequality. If $x_2^* = 0 < x_1^*$, then
$$\mathrm{MRS}(x^*) = \frac{MU_1}{MU_2} \ge \frac{p_1}{p_2},$$
so even at the corner the consumer would trade more of good 2 for good 1 at market prices, but has none left to trade. In general the **Kuhn–Tucker conditions** hold: there is $\lambda \ge 0$ with $MU_i - \lambda p_i \le 0$ and $x_i \ge 0$ for each good, with equality in at least one of the two (**complementary slackness**: $x_i\,(MU_i - \lambda p_i) = 0$). Corners are typical for perfect substitutes, for quasilinear preferences at low incomes, and for goods that are simply not worth their price.`,
      idea: String.raw`The constraint $x_2 \ge 0$ is now part of the problem. At $x_2 = 0$ the only feasible direction along the budget line is toward less good 1. So optimality requires utility not to rise in that direction, $MU_1/p_1 \ge MU_2/p_2$, but not equality. Solving the Lagrange equations of 5.4 regardless gives a "tangency" with negative $x_2$, outside the feasible set. The Kuhn–Tucker conditions repair this: goods bought earn $MU_i/p_i = \lambda$, and goods not bought earn at most $\lambda$ per dollar, the corner version of the equimarginal principle (5.3). For concave utilities the conditions are also sufficient.`,
      caption: String.raw`Choose preferences and move the prices and income. The best bundle $x^*$ is green. When it lands on an axis, the indifference curve through it (purple) cuts the budget line instead of touching it, and the dashed tangency that the Lagrange equations would give sits in the hatched region of negative quantities. The right panel checks the Kuhn–Tucker conditions live, with the marginal utility per dollar of each good compared with $\lambda$.`,
      deps: ['micro-5.2', 'micro-4.12', 'micro-5.3'], refs: ['Varian Ch. 5'], tags: ['optimization'],
      see: ['opt-5.9', 'opt-5.10'],
      credit: 'William Karush, 1939; Harold Kuhn & Albert Tucker, 1951',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Karush%E2%80%93Kuhn%E2%80%93Tucker_conditions' },
      viz(v) {
        const FAM = {
          subs: { label: 'perfect substitutes', F: prefs('subs', { a: 1, b: 1.5 }), tex: 'u = x_1 + 1.5\\,x_2' },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 4 }), tex: 'u = 4\\ln x_1 + x_2' },
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }), tex: 'u = \\sqrt{x_1x_2}' },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'subs');
        const p1 = v.slider('price $p_1$', 0.5, 3, 0.9, { step: 0.05 });
        const p2 = v.slider('price $p_2$', 0.5, 3, 1.5, { step: 0.05 });
        const m = v.slider('income $m$', 3, 16, 9, { step: 0.1 });
        const s = v.stage({ x: [-1.8, 12.5], y: [-1.8, 12.5], height: 390, axes: 'box', weight: 1.2, xlabel: 'x₁', ylabel: 'x₂' });
        const k = v.stage({ x: [0, 10], y: [0, 10], height: 390, axes: false, title: 'Kuhn–Tucker conditions at $x^*$' });
        v.legend([['accent', 'budget line'], ['purple', 'indifference curve through x*'], ['red', 'negative quantities', { area: true }], ['green', 'best bundle', { dot: true }]]);
        let st = {};
        v.render(() => {
          const kind = fam.value, o = FAM[kind], F = o.F, P1 = p1.value, P2 = p2.value, M = m.value, X1 = M / P1, X2 = M / P2, ratio = P1 / P2;
          s.setTitle(`$${o.tex}$`);
          s.rect(-1.8, -1.8, 0, 12.5, { fill: 'red', fillAlpha: 0.05, hatch: 'red', hatchAlpha: 0.3, stroke: false });
          s.rect(0, -1.8, 12.5, 0, { fill: 'red', fillAlpha: 0.05, hatch: 'red', hatchAlpha: 0.3, stroke: false });
          s.line(0, -1.8, 0, 12.5, { color: 'ink', width: 1.3 }); s.line(-1.8, 0, 12.5, 0, { color: 'ink', width: 1.3 });
          s.text('x₂ < 0: not allowed', 12.3, -0.9, { color: 'red', size: 11.5, weight: 600, align: 'right' });
          const xs = F.dem(P1, P2, M), us = F.u(xs[0], xs[1]), tie = kind === 'subs' && Math.abs(1 / P1 - 1.5 / P2) < 1e-9;
          for (const t of [2, 4, 6, 8, 10]) drawLevel(s, F, F.u(t, t), { color: v.color('purple', 0.2), width: 1 });
          budget(s, P1, P2, M);
          s.clip(() => s.line(X1, 0, 0, X2, { color: 'accent', width: 1.2, dash: [4, 4] }), [-1.8, 12.5], [-1.8, 12.5]);
          // the indifference curve through x*, continued into the forbidden region where it has a formula
          if (kind === 'subs') s.clip(() => s.line(-1.8, (us + 1.8) / 1.5, 12.5, (us - 12.5) / 1.5, { color: 'purple', width: 2.4 }));
          else if (kind === 'ql') s.clip(() => s.fn((x) => us - 4 * Math.log(x), { domain: [0.05, 12.5], color: 'purple', width: 2.4 }));
          else drawLevel(s, F, us, { color: 'purple', width: 2.4 });
          // the Lagrange "solution" ignoring x ≥ 0
          let lag = null;
          if (kind === 'ql') { lag = [(4 * P2) / P1, (M - 4 * P2) / P2]; if (lag[1] < 0) { const ly = Math.max(lag[1], -1.6), lx = (M - P2 * ly) / P1; s.dot(lx, ly, { r: 6, hollow: true, color: 'red', width: 2.2 }); s.text(lag[1] < -1.6 ? `tangency at x₂ = ${v.fix(lag[1], 1)} ↓` : 'tangency: x₂ < 0', lx, ly, { dx: -10, dy: -2, color: 'red', ...LBL, align: 'right' }); } }
          if (tie) { s.clip(() => s.line(X1, 0, 0, X2, { color: 'green', width: 5, alpha: 0.6 })); }
          const [g1, g2] = F.grad(xs[0], xs[1]), mrs = g1 / g2;
          const corner = xs[0] < 1e-9 ? 1 : xs[1] < 1e-9 ? 2 : 0;
          if (corner && !tie) {
            s.clip(() => tangent(s, xs[0], xs[1], -mrs, 70, { color: 'purple', width: 2, dash: [6, 4] }));
            const into = corner === 2 ? [X1 * 0.25, -X2 * 0.25] : [-X1 * 0.25, X2 * 0.25];
            pxArrow(s, xs[0], xs[1], into[0], into[1], 46, { color: 'red', width: 2.4, head: 9, dash: [5, 4] });
          }
          s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: tie ? 'any point is best' : 'x*', labelPos: corner === 2 ? 'n' : 'ne' });
          // Kuhn–Tucker panel
          const mu = [g1 / P1, g2 / P2], lam = tie ? mu[0] : corner === 1 ? mu[1] : corner === 2 ? mu[0] : (mu[0] + mu[1]) / 2;
          const top = Math.max(mu[0], mu[1], lam) * 1.25 || 1, Yb = (q) => 5.7 + (3.6 * q) / top;
          [0, 1].forEach((i) => {
            const cx = 2.2 + 2.4 * i, col = i ? 'teal' : 'orange';
            k.rect(cx - 0.6, 5.7, cx + 0.6, Yb(mu[i]), { fill: col, fillAlpha: 0.7, color: col, width: 1.2, radius: 4 });
            k.text(v.fix(mu[i], 3), cx, Yb(mu[i]), { dy: -10, align: 'center', color: col, ...LBL });
            k.tex(`MU_${i + 1}/p_${i + 1}`, cx, 5.25, { size: 14, color: col });
          });
          k.line(0.9, Yb(lam), 5.9, Yb(lam), { color: 'green', width: 2, dash: [6, 4] }); k.tex(`\\lambda = ${v.fix(lam, 3)}`, 6.1, Yb(lam), { align: 'left', color: 'green', size: 15 });
          const ok = (b) => (b ? '✓' : '✗'), tol = 1e-7;
          const rows = [0, 1].map((i) => { const d = (i ? g2 : g1) - lam * (i ? P2 : P1), xi = xs[i]; return [`$x_${i + 1} = ${v.fix(xi, 2)} \\ge 0$, $\\ MU_${i + 1} - \\lambda p_${i + 1} = ${v.fix(d, 3)} \\le 0$`, d <= tol, `$x_${i + 1}\\,(MU_${i + 1} - \\lambda p_${i + 1}) = ${v.fix(xi * d, 3)}$`, Math.abs(xi * d) < 1e-6]; });
          let y = 4.1;
          for (const [a1, b1, a2, b2] of rows) { k.tex(a1, 0.3, y, { rich: true, align: 'left', size: 13 }); k.text(ok(b1), 9.8, y, { color: b1 ? 'green' : 'red', size: 15, weight: 800, align: 'right' }); y -= 0.85; k.tex(a2, 0.6, y, { rich: true, align: 'left', size: 13, color: 'muted' }); k.text(ok(b2), 9.8, y, { color: b2 ? 'green' : 'red', size: 15, weight: 800, align: 'right' }); y -= 1.0; }
          k.tex(`$\\lambda \\ge 0$, budget exhausted: $m - p\\cdot x^* = ${v.fix(M - P1 * xs[0] - P2 * xs[1], 3)}$`, 0.3, y, { rich: true, align: 'left', size: 13 }); k.text('✓', 9.8, y, { color: 'green', size: 15, weight: 800, align: 'right' });
          st = { kind, xs, mrs, ratio, corner, tie, lag, mu, lam };
        });
        v.readout(() => {
          const { kind, xs, mrs, ratio, corner, tie, lag, mu } = st, f = (q) => v.fix(q, 2);
          if (tie) return `Here $MU_1/p_1 = MU_2/p_2$: the indifference lines are parallel to the budget line, every affordable bundle on it is best, and the conditions hold with equality for both goods.`;
          if (!corner) return `Interior optimum $x^* = (${f(xs[0])}, ${f(xs[1])})$: both goods are bought, $MU_1/p_1 = MU_2/p_2 = \\lambda$, and the tangency condition $\\mathrm{MRS} = ${f(mrs)} = p_1/p_2 = ${f(ratio)}$ holds.${kind === 'ql' ? ' Lower the income below $4p_2$ to push the consumer onto the axis.' : kind === 'cd' ? ' Cobb–Douglas curves never reach the axes, so the optimum is always interior.' : ''}`;
          const g = corner === 2 ? 1 : 2, b = corner === 2 ? 2 : 1;
          const ineq = corner === 2 ? `$\\mathrm{MRS} = ${f(mrs)} \\ge p_1/p_2 = ${f(ratio)}$` : `$\\mathrm{MRS} = ${f(mrs)} \\le p_1/p_2 = ${f(ratio)}$`;
          const lg = lag && lag[1] < 0 ? ` Solving the Lagrange equations anyway gives $x_2 = ${f(lag[1])} < 0$, which is not feasible.` : '';
          return `**Corner solution** $x^* = (${f(xs[0])}, ${f(xs[1])})$: only good ${g} is bought. The tangency condition fails and is replaced by ${ineq}: at market prices the consumer would like to swap even more good ${b} for good ${g} but has none left. Good ${b} earns $MU_${b}/p_${b} = ${v.fix(mu[b - 1], 3)}$ per dollar, less than $\\lambda = MU_${g}/p_${g} = ${v.fix(mu[g - 1], 3)}$, so it is rightly not bought (complementary slackness).${lg}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.6
    {
      num: '5.6', kind: 'Definition', name: 'Demand functions and homogeneity of degree zero',
      statement: String.raw`When the consumer's problem has a unique solution for every price vector $p \gg 0$ and income $m > 0$, its solution defines the (Marshallian) **demand functions** $x_1(p_1, p_2, m)$ and $x_2(p_1, p_2, m)$. They are **homogeneous of degree zero**:
$$x_i(tp_1, tp_2, tm) = x_i(p_1, p_2, m) \quad\text{for all } t > 0,$$
so scaling every price and income by the same factor, a change of currency or a perfectly balanced inflation, changes nothing real. If preferences are locally non-satiated, demand also satisfies **Walras' law**, $p_1x_1 + p_2x_2 = m$. Consequently demand depends only on relative prices and real income: $x_i(p_1, p_2, m) = x_i(p_1/p_2, 1, m/p_2)$.`,
      idea: String.raw`The budget set $\{x \ge 0 : tp \cdot x \le tm\}$ is the same set as $\{x \ge 0 : p \cdot x \le m\}$; dividing the inequality by $t > 0$ changes nothing (4.1). The preferences have not changed either, so the best bundle in the set is the same. Homogeneity is therefore a statement about the budget constraint and holds for every preference. What breaks it is a nominal quantity that does not scale with the rest, such as a fixed fee in dollars, a tax bracket that is not indexed, or a consumer whose tastes depend on nominal prices ("money illusion").`,
      caption: String.raw`Move the scale factor $t$. With **prices and income** scaled together the budget line does not move (the dashed line is the original one), the best bundle stays put, and on the right both demands are flat in $t$, even though the price tags in the corner change. Scale **prices only** or **income only** and the line and the bundle move. Switch on the **fixed fee**, a charge that stays at $\$2$ whatever $t$ is, and even balanced scaling moves the bundle.`,
      deps: ['micro-5.1', 'micro-4.1'], refs: ['Varian Ch. 6'], tags: ['demand'],
      see: ['micro-2.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marshallian_demand_function' },
      viz(v) {
        const FAM = { cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.4 }) }, ces: { label: 'CES, $\\sigma = 2$', F: prefs('ces', { a: 0.5, r: 0.5 }) }, comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 1.5 }) } };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const what = v.select('scale by $t$', [{ value: 'all', label: 'prices and income' }, { value: 'p', label: 'prices only' }, { value: 'm', label: 'income only' }], 'all');
        const t = v.slider('scale factor $t$', 0.25, 4, 2, { log: true, sig: 3 });
        const fee = v.toggle('a fixed fee of $\\$2$ that is not scaled', false);
        const B0 = { p1: 2, p2: 1.5, m: 14 };
        const s = v.stage({ x: [0, 13], y: [0, 13], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.1 });
        const g = v.stage({ x: [0.25, 4], y: [0, 9], xlog: true, height: 360, axes: 'box', xlabel: 'scale factor t', ylabel: 'quantity demanded', title: 'demand as the scale factor varies' });
        v.legend([['muted', 'original budget line (t = 1)', { dash: true }], ['accent', 'scaled budget line'], ['orange', 'x₁'], ['teal', 'x₂']]);
        const at = (F, k, T, withFee) => {
          const P1 = k === 'm' ? B0.p1 : T * B0.p1, P2 = k === 'm' ? B0.p2 : T * B0.p2, M = (k === 'p' ? B0.m : T * B0.m) - (withFee ? 2 : 0);
          return { P1, P2, M, x: demand(F, P1, P2, M) };
        };
        let st = {};
        v.render(() => {
          const F = FAM[fam.value].F, k = what.value, T = t.value, fz = fee.value;
          const base = at(F, 'all', 1, fz), cur = at(F, k, T, fz);
          s.line(base.M / base.P1, 0, 0, base.M / base.P2, { color: 'muted', width: 1.8, dash: [7, 5] });
          budget(s, cur.P1, cur.P2, cur.M);
          drawLevel(s, F, F.u(...cur.x), { color: 'purple', width: 2.2 });
          const same = Math.hypot(cur.x[0] - base.x[0], cur.x[1] - base.x[1]) < 1e-6;
          if (!same) s.dot(base.x[0], base.x[1], { r: 6, hollow: true, color: 'muted', width: 2.2, label: 'at t = 1', labelPos: 'sw', labelColor: 'muted' });
          s.dot(cur.x[0], cur.x[1], { r: 6.5, color: 'green', label: same ? 'x* (unchanged)' : 'x*', labelPos: 'ne' });
          const tag = `p₁ = $${v.fix(cur.P1, 2)}   p₂ = $${v.fix(cur.P2, 2)}   m = $${v.fix(cur.M + (fz ? 2 : 0), 2)}${fz ? ' − $2 fee' : ''}`;
          s.textPx(tag, s.width - 10, 16, { align: 'right', color: 'accent', size: 12, weight: 700 });
          // demand against t
          const ts = []; for (let i = 0; i <= 80; i++) ts.push(0.25 * 16 ** (i / 80));
          const xs = ts.map((q) => at(F, k, q, fz).x), top = Math.max(9, ...xs.map((q) => Math.max(q[0], q[1]))) ;
          g.setView([0.25, 4], [0, Math.min(top * 1.08, 30)]);
          g.vline(1, { color: 'muted', width: 1, dash: [3, 3] });
          g.path(ts.map((q, i) => [q, xs[i][0]]), { color: 'orange', width: 2.6 }); g.path(ts.map((q, i) => [q, xs[i][1]]), { color: 'teal', width: 2.6 });
          g.vline(T, { color: 'gold', width: 1.4 });
          g.dot(T, cur.x[0], { r: 5.5, color: 'orange', label: 'x₁', labelPos: 'ne', math: false }); g.dot(T, cur.x[1], { r: 5.5, color: 'teal', label: 'x₂', labelPos: 'se', math: false });
          st = { k, T, fz, base, cur, same };
        });
        v.readout(() => {
          const { k, T, fz, base, cur, same } = st, f = (q) => v.fix(q, 2);
          const head = `$t = ${f(T)}$: prices $(${f(cur.P1)}, ${f(cur.P2)})$ and income ${f(cur.M + (fz ? 2 : 0))}${fz ? ' minus the $\\$2$ fee' : ''}; best bundle $(${f(cur.x[0])}, ${f(cur.x[1])})$ against $(${f(base.x[0])}, ${f(base.x[1])})$ at $t = 1$.`;
          if (k === 'all' && !fz) return `${head} Every nominal number has been multiplied by ${f(T)}, the budget set is the same set, and the bundle has **not moved**: $x(tp, tm) = x(p, m)$, homogeneity of degree zero. Spending is ${f(cur.P1 * cur.x[0] + cur.P2 * cur.x[1])} = $tm$ (Walras' law).`;
          if (k === 'all') return `${head} The fee stays at $\\$2$ while everything else is scaled, so real income $(tm - 2)/t = ${f((T * B0.m - 2) / T)}$ changes with $t$ and so does demand${same ? '' : ' (the bundle moved)'}. Homogeneity needs *every* nominal quantity to scale.`;
          if (k === 'p') return `${head} Scaling only prices by $t$ is the same as dividing income by $t$: the line shifts in parallel ${T > 1 ? 'inward' : 'outward'} and the bundle moves along the income offer curve.`;
          return `${head} Scaling only income shifts the line in parallel ${T > 1 ? 'outward' : 'inward'}; demand moves along the income offer curve (5.8).`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.7
    {
      num: '5.7', kind: 'Proposition', name: 'Cobb–Douglas demand: constant budget shares',
      statement: String.raw`For Cobb–Douglas utility $u(x_1, x_2) = x_1^{\alpha}x_2^{1-\alpha}$ with $0 < \alpha < 1$, demand is
$$x_1(p_1, p_2, m) = \frac{\alpha m}{p_1}, \qquad x_2(p_1, p_2, m) = \frac{(1-\alpha)m}{p_2},$$
so the **budget shares** $s_1 = p_1x_1/m = \alpha$ and $s_2 = 1-\alpha$ do not depend on prices or income. Demand for each good has unit own-price elasticity and unit income elasticity and does not respond to the other good's price. More generally, for CES utility with elasticity of substitution $\sigma$ the ratio of shares obeys $s_1/s_2 = \left(\frac{\alpha}{1-\alpha}\right)^{\sigma}(p_1/p_2)^{1-\sigma}$, so the shares are constant only when $\sigma = 1$, which is the Cobb–Douglas case.`,
      idea: String.raw`Use $\ln u = \alpha\ln x_1 + (1-\alpha)\ln x_2$, which represents the same preferences (4.7). The Lagrange conditions (5.4) read $\alpha/x_1 = \lambda p_1$ and $(1-\alpha)/x_2 = \lambda p_2$, so $p_1x_1 = \alpha/\lambda$ and $p_2x_2 = (1-\alpha)/\lambda$. Adding them gives $1/\lambda = m$, hence $p_1x_1 = \alpha m$. When good 1 gets dearer the consumer buys proportionally less of it, exactly offsetting the price rise in spending. With CES utility the tangency condition is $(x_2/x_1)^{1/\sigma} = \frac{1-\alpha}{\alpha}\frac{p_1}{p_2}$, and raising $p_1$ cuts $x_1$ more than proportionally when $\sigma > 1$ and less when $\sigma < 1$. Geometrically, the best bundle always divides the budget line in the ratio $s_1 : s_2$.`,
      caption: String.raw`Move both prices and income freely. On the map the best bundle splits the budget line into an orange part and a teal part whose lengths are in the ratio $s_1 : s_2$; the bars show the shares themselves. For **Cobb–Douglas** they stay pinned at the exponents $\alpha$ and $1-\alpha$. Switch to **CES** and the share of good 1 moves with the relative price $p_1/p_2$ along the curve in the bottom panel, falling when $\sigma > 1$ and rising when $\sigma < 1$; the faint curves are other values of $\sigma$.`,
      deps: ['micro-5.4', 'micro-4.12'], refs: ['Varian Ch. 6'], tags: ['demand'],
      see: ['micro-3.1', 'micro-3.3'],
      credit: 'Charles Cobb & Paul Douglas, 1928',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cobb%E2%80%93Douglas_production_function' },
      viz(v) {
        const kind = v.select('utility', [{ value: 'cd', label: 'Cobb–Douglas' }, { value: 'ces', label: 'CES' }], 'cd');
        const al = v.slider('weight $\\alpha$', 0.1, 0.9, 0.35, { step: 0.01 });
        const sg = v.slider('elasticity of substitution $\\sigma$', 0.25, 4, 2.5, { log: true, sig: 3 });
        const p1 = v.slider('price $p_1$', 0.5, 4, 1.5, { step: 0.05 });
        const p2 = v.slider('price $p_2$', 0.5, 4, 1, { step: 0.05 });
        const m = v.slider('income $m$', 4, 24, 14, { step: 0.5 });
        const s = v.stage({ x: [0, 16], y: [0, 16], height: 340, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.3 });
        const b = v.stage({ x: [0, 3], y: [0, 1.15], height: 340, axes: false, weight: 0.6, minWidth: 190, title: 'budget shares' });
        const c = v.stage({ x: [0.125, 8], y: [0, 1], xlog: true, height: 190, axes: 'box', full: true, xlabel: 'relative price p₁/p₂', ylabel: 'share s₁', title: 'the share of good 1 against the relative price' });
        v.legend([['orange', 'share of good 1'], ['teal', 'share of good 2'], ['purple', 'indifference curve'], ['green', 'best bundle', { dot: true }]]);
        const share1 = (a, sig, rel) => (Math.abs(sig - 1) < 1e-6 ? a : 1 / (1 + ((1 - a) / a) ** sig * rel ** (sig - 1)));
        let st = {};
        v.render(() => {
          const cd = kind.value === 'cd', a = al.value, sig = cd ? 1 : sg.value, P1 = p1.value, P2 = p2.value, M = m.value;
          sg.el.hidden = cd;
          const F = cd || Math.abs(sig - 1) < 1e-3 ? prefs('cd', { a }) : prefs('ces', { a, r: 1 - 1 / sig });
          const xs = F.dem(P1, P2, M), s1 = (P1 * xs[0]) / M, X1 = M / P1, X2 = M / P2;
          s.clip(() => s.poly([[0, 0], [X1, 0], [0, X2]], { fill: 'accent', fillAlpha: 0.08, stroke: false }));
          drawLevel(s, F, F.u(...xs), { color: 'purple', width: 2.2 });
          s.clip(() => { s.line(0, X2, xs[0], xs[1], { color: 'orange', width: 5 }); s.line(xs[0], xs[1], X1, 0, { color: 'teal', width: 5 }); });
          const lab = (x0, y0, x1, y1, txt, col, side) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; if (mx < 15.5 && my < 15.5) s.text(txt, mx, my, { dx: side * 10, dy: side * 10, color: col, ...LBL, align: side > 0 ? 'left' : 'right' }); };
          lab(0, X2, xs[0], xs[1], `s₁ = ${v.fix(s1, 2)}`, 'orange', 1); lab(xs[0], xs[1], X1, 0, `s₂ = ${v.fix(1 - s1, 2)}`, 'teal', -1);
          s.line(xs[0], 0, xs[0], xs[1], GUIDE);
          s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
          // share bars
          [[0.85, s1, 'orange', 's₁'], [2.15, 1 - s1, 'teal', 's₂']].forEach(([x, h, col, nm]) => {
            b.rect(x - 0.42, 0, x + 0.42, h, { fill: col, fillAlpha: 0.72, color: col, width: 1.2, radius: 6 });
            b.text(`${nm} = ${v.fix(h, 3)}`, x, h, { dy: -11, align: 'center', color: col, ...LBL });
          });
          b.line(0.25, 0, 2.75, 0, { color: 'ink', width: 1.2 });
          if (cd) { b.line(0.3, a, 1.4, a, { color: 'ink', width: 1.6, dash: [5, 4] }); b.line(1.6, 1 - a, 2.7, 1 - a, { color: 'ink', width: 1.6, dash: [5, 4] }); b.text('α', 0.3, a, { dx: -4, dy: 0, align: 'right', math: true, size: 15 }); b.text('1 − α', 2.7, 1 - a, { dx: 4, align: 'left', math: true, size: 13 }); }
          // share against the relative price
          for (const q of [0.5, 2]) if (Math.abs(q - sig) > 0.08) c.fn((r) => share1(a, q, r), { domain: [0.125, 8], color: 'faint', width: 1.4, n: 200 });
          c.hline(a, { color: 'muted', width: 1.2, dash: [4, 4] }); c.text(`α = ${v.fix(a, 2)}`, 0.13, a, { dx: 4, dy: -9, color: 'muted', size: 11.5, align: 'left' });
          c.fn((r) => share1(a, sig, r), { domain: [0.125, 8], color: 'orange', width: 2.8, n: 240 });
          const rel = P1 / P2; c.vline(rel, GUIDE); c.dot(rel, s1, { r: 6.5, color: 'orange' });
          c.text(cd ? 'σ = 1: flat' : `σ = ${v.fix(sig, 2)}`, 7.8, share1(a, sig, 7.8), { dy: share1(a, sig, 7.8) > 0.85 ? 14 : -11, color: 'orange', ...LBL, align: 'right' });
          st = { cd, a, sig, P1, P2, M, xs, s1 };
        });
        v.readout(() => {
          const { cd, a, sig, P1, P2, M, xs, s1 } = st, f = (q) => v.fix(q, 2);
          const sp = `Spending $p_1x_1 = ${f(P1 * xs[0])}$ and $p_2x_2 = ${f(P2 * xs[1])}$ out of $m = ${f(M)}$: shares $s_1 = ${v.fix(s1, 3)}$, $s_2 = ${v.fix(1 - s1, 3)}$.`;
          if (cd) return `${sp} With $x_1 = \\alpha m/p_1$ the share of good 1 is $\\alpha = ${f(a)}$ at every price and income: when $p_1$ rises, $x_1$ falls in exact proportion. Own-price and income elasticities are 1, and $x_1$ ignores $p_2$.`;
          return `${sp} With CES utility the shares obey $s_1/s_2 = (\\alpha/(1-\\alpha))^{\\sigma}(p_1/p_2)^{1-\\sigma}$, so at $\\sigma = ${f(sig)}$ a 1% rise in $p_1/p_2$ changes $s_1/s_2$ by ${f(1 - sig)}%: ${sig > 1 ? 'good 1 is easily replaced, so its share **falls** as it gets dearer' : sig < 1 ? 'good 1 is hard to replace, so its share **rises** as it gets dearer' : 'shares stay put'}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.8
    {
      num: '5.8', kind: 'Definition', name: 'Income offer curve and Engel curve',
      statement: String.raw`Hold prices fixed and let income $m$ vary. The best bundles $x(p, m)$ trace the **income offer curve** (or income expansion path) in the commodity plane. The graph of one good's demand against income, $m \mapsto x_1(p, m)$, is that good's **Engel curve**. A good is **normal** if its demand rises with income ($\partial x_1/\partial m > 0$) and **inferior** if it falls. The **income elasticity** $\eta = \frac{\partial x_1}{\partial m}\frac{m}{x_1}$ classifies normal goods further into necessities ($0 < \eta < 1$, shrinking budget share) and luxuries ($\eta > 1$). By Walras' law the spending-weighted income elasticities average to one, so not every good can be inferior.`,
      idea: String.raw`A rise in income shifts the budget line outward in parallel (4.1), and the tangency slides to a higher indifference curve at the same price ratio, so the income offer curve connects the points where the indifference curves have slope $-p_1/p_2$. Its shape is set by how the MRS changes along vertical and horizontal lines. If the MRS is constant along rays (homothetic preferences, 5.14), the path is a ray and Engel curves are straight lines through the origin. If it is constant along vertical lines (quasilinear), the path turns vertical once income is high enough. If higher indifference curves are *flatter* above a given $x_1$, the tangency moves left and good 1 is inferior. Differentiating $p_1x_1 + p_2x_2 = m$ in $m$ gives $s_1\eta_1 + s_2\eta_2 = 1$.`,
      caption: String.raw`Slide income. On the map the budget line shifts in parallel (faint lines at other incomes) and the best bundle traces the green income offer curve; the bold part is the path so far. The panel below shares the $x_1$ axis and plots the Engel curve, with income on the vertical axis as is customary. **Cobb–Douglas** and **perfect complements** give rays and straight Engel curves; **quasilinear** preferences give a corner at low income and then a vertical path; with **inferior good 1** the consumer first spends everything on good 1, then buys less of it as income rises, and the Engel curve bends backward.`,
      deps: ['micro-5.6'], refs: ['Varian Ch. 6'], tags: ['demand', 'income'],
      see: ['micro-3.3', 'micro-2.2'],
      credit: 'Ernst Engel, 1857',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Engel_curve' },
      viz(v) {
        const p1 = 1, p2 = 2;
        const FAM = {
          cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.4 }) },
          comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 2 }) },
          ql: { label: 'quasilinear', F: prefs('ql', { a: 2.5 }) },
          inf: { label: 'inferior good 1', F: prefs('inf', { A: 5, k: 8 }) },
        };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const m = v.slider('income $m$', 1, 18, 12, { step: 0.1 });
        const s = v.stage({ x: [0, 18.5], y: [0, 9.6], height: 300, axes: 'box', full: true, xlabel: 'x₁', ylabel: 'x₂', title: 'the income offer curve ($p_1 = 1$, $p_2 = 2$)' });
        const e = v.stage({ x: [0, 18.5], y: [0, 19], height: 230, axes: 'box', full: true, xlabel: 'x₁', ylabel: 'income m', title: 'the Engel curve of good 1' });
        v.legend([['accent', 'budget line'], ['purple', 'indifference curve'], ['green', 'income offer curve'], ['orange', 'Engel curve']]);
        const cache = {};
        const path = (k) => cache[k] || (cache[k] = (() => { const F = FAM[k].F, out = []; for (let i = 0; i <= 170; i++) { const M = 0.1 + (17.9 * i) / 170; out.push([M, demand(F, p1, p2, M)]); } return out; })());
        let st = {};
        v.render(() => {
          const k = fam.value, F = FAM[k].F, M = m.value, pts = path(k), xs = demand(F, p1, p2, M);
          for (let q = 2; q <= 18; q += 2) { s.clip(() => s.line(q / p1, 0, 0, q / p2, { color: 'accent', width: 1, alpha: 0.22 })); const d = demand(F, p1, p2, q); if (d[0] <= 18.4 && d[1] <= 9.5) s.dot(d[0], d[1], { r: 3, color: 'green', alpha: 0.55 }); }
          budget(s, p1, p2, M);
          drawLevel(s, F, F.u(...xs), { color: 'purple', width: 2.2 });
          const now = pts.filter((q) => q[0] <= M).map((q) => q[1]), later = pts.filter((q) => q[0] >= M).map((q) => q[1]);
          s.clip(() => { s.path(later, { color: 'green', width: 1.6, dash: [5, 4], alpha: 0.7 }); s.path([...now, xs], { color: 'green', width: 3.2 }); });
          s.line(xs[0], 0, xs[0], xs[1], GUIDE);
          s.dot(xs[0], xs[1], { r: 6.5, color: 'green', label: 'x*', labelPos: 'ne' });
          // Engel curve
          e.clip(() => { e.path(pts.map((q) => [q[1][0], q[0]]), { color: 'orange', width: 1.6, alpha: 0.45 }); e.path([...pts.filter((q) => q[0] <= M).map((q) => [q[1][0], q[0]]), [xs[0], M]], { color: 'orange', width: 3.2 }); });
          e.line(0, M, xs[0], M, GUIDE); e.line(xs[0], M, xs[0], 19, GUIDE);
          e.dot(xs[0], M, { r: 6.5, color: 'orange' });
          e.text(`m = ${v.fix(M, 1)}`, 0, M, { dx: 34, dy: -9, color: 'accent', ...LBL, align: 'left' });
          // income elasticity by a central difference
          const h = 0.01, xa = demand(F, p1, p2, M - h)[0], xb = demand(F, p1, p2, M + h)[0], dx = (xb - xa) / (2 * h), eta = (dx * M) / xs[0];
          st = { k, M, xs, dx, eta };
        });
        v.readout(() => {
          const { k, M, xs, dx, eta } = st, f = (q) => v.fix(q, 2);
          const cls = Math.abs(dx) < 1e-6 ? '**neither normal nor inferior** here: extra income goes entirely to good 2' : dx < 0 ? '**inferior**: more income, less of it' : eta > 1.0001 ? '**a luxury**' : eta < 0.9999 ? '**a necessity**' : '**normal**, with its budget share constant';
          const note = { cd: 'Cobb–Douglas: the path is a ray and $x_1 = 0.4\\,m/p_1$, a straight Engel curve through the origin.', comp: 'Perfect complements: the goods are bought in the fixed ratio $x_2 = x_1/2$, so the path is the ray of corners.', ql: 'Quasilinear: below $m = 2.5\\,p_2 = 5$ only good 1 is bought; beyond, $x_1 = 2.5\\,p_2/p_1 = 5$ is fixed and every extra dollar goes to good 2.', inf: 'Inferior good 1: at low incomes all money goes to good 1 (a corner); beyond about $m = 5$ the higher indifference curves are flatter, the tangency moves left, and good 1 is bought less.' }[k];
          return `At $m = ${f(M)}$ the best bundle is $(${f(xs[0])}, ${f(xs[1])})$; $\\partial x_1/\\partial m = ${f(dx)}$ and the income elasticity is $\\eta = ${f(eta)}$, so good 1 is ${cls}. ${note}`;
        });
      },
    },
  ],
};
