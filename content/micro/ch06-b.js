// Microeconomics — Chapter 6 (part b): price indices, welfare measures and the sign of the substitution effect (items 6.7–6.13)
import { clamp, GUIDE, LBL, sgn, prefs, demand, hicks, slutsky, simpson, drawLevel, trimArrow, budget, bline } from './ch06.shared.js';

/** CES preferences with elasticity of substitution σ (σ = 0: perfect complements, σ = 1: Cobb–Douglas). */
const cesSigma = (sg, a = 0.5) => (sg < 0.02 ? prefs('comp', { a: 1, b: 1 }) : Math.abs(sg - 1) < 0.02 ? prefs('cd', { a }) : prefs('ces', { a, r: 1 - 1 / sg }));
/** Inverse of g2(y) = (y^(1−η) − 1)/(1 − η) (ln y when η = 1); null when no y ≥ 0 reaches z. */
const g2inv = (z, eta) => { if (Math.abs(1 - eta) < 1e-9) return Math.exp(z); const b = 1 + (1 - eta) * z; return b > 0 ? b ** (1 / (1 - eta)) : null; };
/** Vertical position of the indifference curve u = L of the 'ie' family at x1 = x (p2 = 1 units). */
const ieY = (F, L, x) => g2inv(L - F.a * Math.log(x), F.eta);

export default {
  collection: 'micro',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.7
    {
      num: '6.7', kind: 'Proposition', name: 'Price indices and substitution bias',
      statement: String.raw`A consumer buys $x^0$ at base prices $p^0$ with income $m_0 = p^0\cdot x^0$, reaching utility $u_0$. When prices change to $p^1$:
- the **Laspeyres** index $L = p^1\cdot x^0 / p^0\cdot x^0$ prices the old basket;
- the **true cost-of-living** (Konüs) index $K(u) = e(p^1, u)/e(p^0, u)$ asks what it costs to stay equally well off;
- the **Paasche** index $P = p^1\cdot x^1 / p^0\cdot x^1$ prices the new basket $x^1$.
Then $L \ge K(u_0)$ and $P \le K(u_1)$, where $u_1$ is the utility reached with $x^1$. When preferences are homothetic $K$ does not depend on $u$, so $P \le K \le L$. The gap $L - K$ is the **substitution bias** of a fixed-basket index: it is zero only when the consumer cannot substitute (perfect complements) or when all prices change in proportion, and it grows with the elasticity of substitution and with the spread of relative price changes.`,
      idea: String.raw`The old basket $x^0$ still delivers $u_0$, so at the new prices it is one way of reaching $u_0$, and the cheapest way costs no more: $e(p^1, u_0) \le p^1\cdot x^0$. Since $e(p^0, u_0) = m_0 = p^0\cdot x^0$ (5.11), dividing gives $K(u_0) \le L$. The same argument with the roles of the periods exchanged, using that $x^1$ reaches $u_1$ at base prices for $p^0\cdot x^1$, gives $P \le K(u_1)$. Geometrically: the Laspeyres line passes through $x^0$ at the new slope and cuts the old indifference curve, while the true-cost line is parallel to it and only touches the curve, and the distance between the two lines is the bias. The consumer price index is a Laspeyres index, so it overstates inflation (macro 1.7).`,
      caption: String.raw`Move the new prices of the two goods (both start at 1, income 10). The red line prices the old basket $x^0$ at the new prices (Laspeyres); the green line is the cheapest budget at the new prices that still reaches the old indifference curve (true cost of living). The hatched strip between them is the substitution bias. The bars compare the Paasche, Fisher, true and Laspeyres indices, and the lower panel plots them against the price of good 1. Lower the **elasticity of substitution** to 0 and the bias vanishes; move both prices in proportion and it vanishes too.`,
      deps: ['micro-6.4', 'micro-5.10'], refs: ['Varian Ch. 7'], tags: ['index numbers', 'welfare'],
      see: ['macro-1.7', 'macro-1.6', 'micro-5.12'],
      credit: 'Étienne Laspeyres, 1871; Hermann Paasche, 1874; Alexander Konüs, 1924',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cost-of-living_index' },
      viz(v) {
        const m0 = 10;
        const sg = v.slider('elasticity of substitution $\\sigma$', 0, 3, 1.5, { step: 0.05 });
        const q1 = v.slider("new price of good 1 $p_1'$", 0.4, 3, 2, { step: 0.01 });
        const q2 = v.slider("new price of good 2 $p_2'$", 0.4, 3, 1, { step: 0.01 });
        const s = v.stage({ x: [0, 13], y: [0, 13], height: 370, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.2, title: 'the old basket at new prices' });
        const b = v.stage({ x: [0, 1], y: [0, 4.4], height: 370, axes: false, weight: 0.8, minWidth: 230, title: 'price indices (base = 1)' });
        const c = v.stage({ x: [0.4, 3], y: [0.5, 2.5], height: 190, axes: 'box', full: true, xlabel: "new price of good 1, p₁'", ylabel: 'index', title: "the indices against $p_1'$ (with $p_2'$ as set)" });
        v.legend([['muted', 'base budget', { dash: true }], ['red', 'Laspeyres: old basket at new prices'], ['green', 'true cost of living: cheapest way back to u₀'], ['purple', 'old indifference curve u₀'], ['orange', 'Paasche', {}], ['gold', 'Fisher']]);
        const idx = (F, P1, P2) => {
          const x0 = demand(F, 1, 1, m0), u0 = F.u(...x0), L = (P1 * x0[0] + P2 * x0[1]) / m0, H = hicks(F, P1, P2, u0), K = H.e / m0;
          const x1 = demand(F, P1, P2, L * m0), P = (P1 * x1[0] + P2 * x1[1]) / (x1[0] + x1[1]);
          return { x0, u0, L, K, P, H, x1, Fi: Math.sqrt(L * P) };
        };
        const cache = {};
        let st = {};
        v.render(() => {
          const S = sg.value, F = cesSigma(S), P1 = q1.value, P2 = q2.value, r = idx(F, P1, P2), { x0, u0, L, K, H } = r;
          bline(s, 1, 1, m0, { color: 'muted', width: 1.6, dash: [7, 5] });
          drawLevel(s, F, u0, { color: 'purple', width: 2.4 });
          const mL = L * m0, mK = K * m0;
          if (mL - mK > 1e-3) s.clip(() => s.poly([[mK / P1, 0], [mL / P1, 0], [0, mL / P2], [0, mK / P2]], { fill: 'red', fillAlpha: 0.1, hatch: 'red', hatchAlpha: 0.45, stroke: false }));
          s.clip(() => s.line(mL / P1, 0, 0, mL / P2, { color: 'red', width: 2.6 }));
          s.clip(() => s.line(mK / P1, 0, 0, mK / P2, { color: 'green', width: 2.6 }));
          s.dot(x0[0], x0[1], { r: 6.5, color: 'ink', label: 'x⁰', labelPos: 'ne', math: false });
          s.dot(H.x[0], H.x[1], { r: 6, color: 'green', label: 'cheapest', labelPos: P1 > P2 ? 'nw' : 'se', math: false });
          if (mL - mK > 0.05) s.corner(`bias: the old basket costs ${v.fix(mL, 2)}, staying as well off costs ${v.fix(mK, 2)}`, 'tr', { color: 'red', weight: 700 });
          // bars
          const rows = [['Paasche P', r.P, 'orange'], ['Fisher √(LP)', r.Fi, 'gold'], ['true cost K', K, 'green'], ['Laspeyres L', L, 'red']];
          const top = Math.max(...rows.map((q) => q[1]), 1) * 1.25;
          b.setView([0, top], [0, 4.4]);
          rows.forEach(([nm, val, col], i) => { const y = 3.7 - i; b.rect(0, y - 0.28, val, y + 0.28, { fill: col, fillAlpha: 0.7, stroke: false, radius: 3 }); b.text(`${nm} = ${v.fix(val, 3)}`, 0, y + 0.45, { dx: 4, color: 'ink', size: 11.5, weight: 600, align: 'left' }); });
          b.line(1, 0.2, 1, 4.3, { color: 'muted', width: 1, dash: [3, 3] });
          // indices against p1'
          const key = `${S}|${P2}`;
          if (!cache[key]) { const out = []; for (let i = 0; i <= 40; i++) { const p = 0.4 + (2.6 * i) / 40, q = idx(F, p, P2); out.push([p, q.L, q.K, q.P, q.Fi]); } cache[key] = out; }
          const cv = cache[key], all = cv.flatMap((z) => z.slice(1)), lo = Math.min(...all), hi = Math.max(...all);
          c.setView([0.4, 3], [Math.max(0, lo - 0.08 * (hi - lo)), hi + 0.08 * (hi - lo)]);
          [[1, 'red'], [2, 'green'], [3, 'orange'], [4, 'gold']].forEach(([j, col]) => c.path(cv.map((z) => [z[0], z[j]]), { color: col, width: j === 4 ? 1.6 : 2.4, dash: j === 4 ? [5, 4] : null }));
          c.vline(P1, GUIDE);
          st = { S, P1, P2, ...r };
        });
        v.readout(() => {
          const { S, P1, P2, L, K, P, Fi } = st, f = (q) => v.fix(q, 3);
          const prop = Math.abs(P1 - P2) < 0.01 ? ' Both prices moved in proportion, so relative prices are unchanged and every index equals the common factor.' : '';
          const sig = S < 0.02 ? ' With $\\sigma = 0$ (perfect complements) nobody substitutes, so the old basket *is* the cheapest way back: no bias.' : '';
          return `Laspeyres $L = ${f(L)}$ $\\ge$ true $K = ${f(K)}$ $\\ge$ Paasche $P = ${f(P)}$ (Fisher ${f(Fi)}). Pricing the old basket overstates the rise in the cost of living by ${v.fix(100 * (L / K - 1), 2)}%: the consumer can reach her old indifference curve more cheaply by substituting toward the good that became relatively cheaper. CES preferences are homothetic, so $K$ is the same at every utility level.${prop}${sig}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.8
    {
      num: '6.8', kind: 'Proposition', name: 'Consumer surplus is exact with quasilinear utility',
      statement: String.raw`Let $u(x_1, x_2) = \phi(x_1) + x_2$ with $\phi$ increasing and strictly concave, good 2 the numeraire ($p_2 = 1$), and income large enough that both goods are bought. Then the inverse demand for good 1 is $p_1 = \phi'(x_1)$, independent of income, and when the price falls from $p$ to $p'$ the change in utility equals the change in consumer surplus:
$$u(p') - u(p) = \int_{p'}^{p} x_1(t)\,dt,$$
the area to the left of the demand curve between the two prices. Because utility is measured in units of good 2, this area is also the compensating and the equivalent variation (6.9, 6.10). With income effects the area is not the change of any utility function in money, and the vertical distance between two indifference curves depends on where it is measured.`,
      idea: String.raw`At an interior optimum $\phi'(x_1) = p_1$, so the indirect utility is $v(p_1, m) = \phi(x_1(p_1)) - p_1 x_1(p_1) + m$. By the envelope theorem (or Roy's identity, 5.13) $\partial v/\partial p_1 = -x_1(p_1)$, and integrating with the fundamental theorem of calculus (Rudin 6.21) gives the formula. Geometrically, quasilinear indifference curves are vertical translates of one another (4.12), so the vertical distance between two of them is the same at every $x_1$: one number measures the welfare change, in units of good 2, whatever the prices. Add an income effect and the curves fan out, so different ways of measuring the gap (at the old or new prices) give different money values.`,
      caption: String.raw`The price of good 1 falls from 2 to the slider value (good 2 costs 1, income 10). Left: the old and new indifference curves, with the vertical gap between them measured at five places. Right: the demand curve, with the consumer-surplus gain shaded. Below: the gap at every $x_1$ against the shaded area (the horizontal line). With the **income effect** $\eta = 0$ the utility is $3\ln x_1 + x_2$: the curves are vertical translates, the gap is flat and equals the area. Raise $\eta$ and the gap starts to vary, so no single number is "the" welfare change.`,
      deps: ['micro-3.6', 'micro-4.12', 'pma-6.21'], refs: ['Varian Ch. 14'], tags: ['welfare'],
      see: ['micro-5.13', 'micro-6.11'],
      credit: 'Jules Dupuit, 1844; Alfred Marshall, 1890',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quasilinear_utility' },
      viz(v) {
        const M = 10, P0 = 2;
        const eta = v.slider('income effect $\\eta$ (0 = quasilinear)', 0, 1, 0, { step: 0.01 });
        const pn = v.slider("new price $p_1'$", 0.4, 1.9, 0.8, { step: 0.01 });
        const s = v.stage({ x: [0, 13], y: [0, 12], height: 340, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15, title: 'indifference curves before and after' });
        const d = v.stage({ x: [0, 13], y: [0, 2.6], height: 340, axes: 'box', xlabel: 'x₁', ylabel: 'p₁', title: 'demand and the gain in consumer surplus' });
        const g = v.stage({ x: [0.5, 12.5], y: [0, 4], height: 170, axes: 'box', full: true, xlabel: 'x₁ (where the gap is measured)', ylabel: 'gap', title: 'vertical gap between the two curves, against the consumer-surplus area' });
        v.legend([['purple', 'indifference curves u₀ (old) and u₁ (new)'], ['gold', 'vertical gaps'], ['accent', 'demand curve'], ['orange', 'ΔCS', { area: true }]]);
        let st = {};
        v.render(() => {
          const F = prefs('ie', { a: 3, eta: eta.value }), P = pn.value;
          const A = demand(F, P0, 1, M), C = demand(F, P, 1, M), u0 = F.u(...A), u1 = F.u(...C);
          bline(s, P0, 1, M, { color: 'muted', width: 1.6, dash: [7, 5] }); budget(s, P, 1, M, { fillAlpha: 0.06 });
          drawLevel(s, F, u0, { color: 'purple', width: 2.2 }); drawLevel(s, F, u1, { color: 'purple', width: 2.6 });
          s.dot(A[0], A[1], { r: 5.5, color: 'ink', label: 'A', labelPos: 'sw' }); s.dot(C[0], C[1], { r: 6, color: 'green', label: 'C', labelPos: 'ne' });
          const gap = (x) => { const y0 = ieY(F, u0, x), y1 = ieY(F, u1, x); return y0 != null && y1 != null ? y1 - y0 : null; };
          for (const x of [1.5, 3.5, 5.5, 8, 11]) { const y0 = ieY(F, u0, x), y1 = ieY(F, u1, x); if (y0 == null || y1 == null || y1 > 11.8) continue; s.arrow(x, y0, x, y1, { color: 'gold', width: 2.2, head: 7 }); s.text(v.fix(y1 - y0, 2), x, (y0 + y1) / 2, { dx: 5, color: 'gold', size: 11, weight: 700, align: 'left', plate: true }); }
          // demand and area
          const xd = (p) => demand(F, p, 1, M)[0];
          const area = simpson(xd, P, P0, 80);
          d.clip(() => { const pts = []; for (let i = 0; i <= 100; i++) { const p = 0.3 + (2.3 * i) / 100; pts.push([xd(p), p]); } d.path(pts, { color: 'accent', width: 2.6 }); const reg = []; for (let i = 0; i <= 60; i++) { const p = P + ((P0 - P) * i) / 60; reg.push([xd(p), p]); } d.poly([[0, P], ...reg, [0, P0]], { fill: 'orange', fillAlpha: 0.3, stroke: false }); });
          d.hline(P0, { color: 'muted', width: 1, dash: [3, 3] }); d.hline(P, { color: 'muted', width: 1, dash: [3, 3] });
          d.dot(A[0], P0, { r: 5.5, color: 'ink', label: 'A', labelPos: 'ne' }); d.dot(C[0], P, { r: 6, color: 'green', label: 'C', labelPos: 'ne' });
          d.text(`ΔCS = ${v.fix(area, 3)}`, 0.3, (P + P0) / 2, { dx: 6, color: 'orange', ...LBL, align: 'left', plate: true });
          // gap function
          const xs = []; for (let i = 0; i <= 120; i++) xs.push(0.5 + (12 * i) / 120);
          const gs = xs.map(gap), ok = gs.filter((q) => q != null), gmin = Math.min(...ok), gmax = Math.max(...ok);
          g.setView([0.5, 12.5], [0, Math.max(area, gmax) * 1.3 + 0.1]);
          g.hline(area, { color: 'orange', width: 2.2, dash: [6, 4] });
          g.text(`area ΔCS = ${v.fix(area, 3)}`, 12.4, area, { dy: -10, color: 'orange', ...LBL, align: 'right' });
          g.path(xs.map((x, i) => (gs[i] == null ? null : [x, gs[i]])), { color: 'gold', width: 2.6 });
          st = { e: eta.value, P, area, gmin, gmax, du: u1 - u0 };
        });
        v.readout(() => {
          const { e, P, area, gmin, gmax, du } = st, f = (q) => v.fix(q, 3);
          if (e < 1e-6) return `Quasilinear: when $p_1$ falls from 2 to ${v.fix(P, 2)} utility rises by $\\Delta u = ${f(du)}$, the area to the left of the demand curve is ${f(area)}, and the vertical gap between the curves is ${f(gmin)} everywhere (from ${f(gmin)} to ${f(gmax)}). One number, in units of good 2, measures the gain exactly.`;
          return `With $\\eta = ${v.fix(e, 2)}$ good 1 has an income effect. The consumer-surplus area is ${f(area)}, but the vertical gap between the two curves now ranges from ${f(gmin)} to ${f(gmax)} depending on where it is measured, and the utility change ${f(du)} is in utils, not money. The area is only an approximation, lying between the compensating and equivalent variations (6.11).`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9', kind: 'Definition', name: 'Compensating variation',
      statement: String.raw`When prices change from $p^0$ to $p^1$, the **compensating variation** is the change in income that, at the *new* prices, would leave the consumer exactly as well off as before:
$$CV = e(p^1, u_0) - e(p^1, u_1) = e(p^1, u_0) - m,$$
where $u_0 = v(p^0, m)$ and $u_1 = v(p^1, m)$. With this sign convention $CV > 0$ is the payment needed after a price rise, and $CV < 0$ is the most the consumer would give up after a price cut. When only $p_1$ changes, Shephard's lemma gives
$$CV = \int_{p_1^0}^{p_1^1} h_1(t, p_2, u_0)\,dt,$$
the area to the left of the Hicksian demand curve at the *old* utility, between the two prices.`,
      idea: String.raw`After a price rise the new budget line lies below the old indifference curve. Push it outward, parallel, until it just touches that curve: the extra income needed is $e(p^1, u_0) - m$. The expenditure function's slope in $p_1$ is Hicksian demand (Shephard's lemma, 5.12), so the fundamental theorem of calculus turns the difference $e(p^1, u_0) - e(p^0, u_0)$ into the area under $h_1(\cdot, u_0)$; and $e(p^0, u_0) = m$ by duality (5.11). CV is how much a policy that raises prices would have to compensate the people it affects; because it holds the old utility fixed, it is natural for a "do no harm" test.`,
      caption: String.raw`The price of good 1 rises from 1 to the slider value (income 10, $p_2 = 1$). Slide the **compensation** to push the new budget line outward (orange) until it just touches the old indifference curve, or press the button. The right panel shows ordinary demand (blue) and the Hicksian demand at the old utility (orange); the shaded area under the Hicksian curve between the two prices is computed by integration and equals the compensating variation found on the map.`,
      deps: ['micro-5.10', 'micro-6.1', 'micro-5.12'], refs: ['Varian Ch. 14'], tags: ['welfare'],
      see: ['micro-6.10', 'micro-6.11'],
      credit: 'John Hicks, 1939–1943',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Compensating_variation' },
      viz(v) {
        const M = 10, P0 = 1;
        const FAM = { cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }) }, ces: { label: 'CES, $\\sigma = \\tfrac12$', F: prefs('ces', { a: 0.5, r: -1 }) }, ql: { label: 'quasilinear', F: prefs('ql', { a: 3 }) }, comp: { label: 'perfect complements', F: prefs('comp', { a: 1, b: 1 }) } };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const pn = v.slider("new price $p_1'$", 1, 3, 2, { step: 0.01 });
        const cc = v.slider('compensation $c$', 0, 10, 2, { step: 0.01 });
        let cvNow = 0;
        v.button('compensate exactly', () => cc.set(clamp(cvNow, 0, 10)));
        const s = v.stage({ x: [0, 14], y: [0, 14], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15 });
        const d = v.stage({ x: [0, 10], y: [0.5, 3.2], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'p₁', title: 'CV = area left of the Hicksian demand at $u_0$' });
        v.legend([['muted', 'old budget', { dash: true }], ['accent', 'new budget'], ['orange', 'new prices, income m + c'], ['purple', 'old indifference curve u₀'], ['orange', 'Hicksian demand h₁(p, u₀)', { dash: true }]]);
        let st = {};
        v.render(() => {
          const k = fam.value, F = FAM[k].F, P = pn.value, C = cc.value;
          const A = demand(F, P0, 1, M), u0 = F.u(...A), Cn = demand(F, P, 1, M), H = hicks(F, P, 1, u0), CV = H.e - M; cvNow = CV;
          const touch = Math.abs(C - CV) < 0.03;
          bline(s, P0, 1, M, { color: 'muted', width: 1.6, dash: [7, 5] }); budget(s, P, 1, M, { fillAlpha: 0.06 });
          drawLevel(s, F, u0, { color: 'purple', width: 2.6 }); drawLevel(s, F, F.u(...Cn), { color: v.color('purple', 0.45), width: 1.3 });
          s.clip(() => s.line((M + C) / P, 0, 0, M + C, { color: touch ? 'green' : 'orange', width: 2.6 }));
          if (C > 0.15 && M + C < 13.8) { s.measure(0.35, M, 0.35, M + C, null, { color: 'orange' }); s.text(`c = ${v.fix(C, 2)}`, 0.5, M + C / 2, { dx: 6, color: 'orange', ...LBL, align: 'left', plate: true }); }
          s.dot(A[0], A[1], { r: 6, color: 'ink', label: 'A', labelPos: 'ne' }); s.dot(Cn[0], Cn[1], { r: 5.5, color: 'accent', label: 'C', labelPos: 'sw' });
          s.dot(H.x[0], H.x[1], { r: 5.5, color: touch ? 'green' : 'orange', label: 'B', labelPos: 'nw' });
          s.corner(touch ? 'the line just touches u₀: c = CV' : C < CV ? 'still below the old curve: not enough' : 'beyond the old curve: too much', 'tr', { color: touch ? 'green' : C < CV ? 'red' : 'gold', weight: 700 });
          // demand panel
          const hk = (p) => hicks(F, p, 1, u0).x[0], xd = (p) => demand(F, p, 1, M)[0];
          const area = simpson(hk, P0, P, 40);
          const ps = []; for (let i = 0; i <= 60; i++) ps.push(0.5 + (2.7 * i) / 60);
          d.clip(() => {
            const reg = []; for (let i = 0; i <= 40; i++) { const p = P0 + ((P - P0) * i) / 40; reg.push([hk(p), p]); }
            d.poly([[0, P0], ...reg, [0, P]], { fill: 'orange', fillAlpha: 0.28, stroke: false });
            d.path(ps.map((p) => [xd(p), p]), { color: 'accent', width: 2.6 }); d.path(ps.map((p) => [hk(p), p]), { color: 'orange', width: 2.4, dash: [7, 4] });
          });
          d.hline(P0, { color: 'muted', width: 1, dash: [3, 3] }); d.hline(P, { color: 'muted', width: 1, dash: [3, 3] });
          d.text(`area = ${v.fix(area, 3)}`, 0.2, (P0 + P) / 2, { dx: 4, color: 'orange', ...LBL, align: 'left', plate: true });
          st = { k, P, C, CV, area, touch };
        });
        v.readout(() => {
          const { k, P, C, CV, area, touch } = st, f = (q) => v.fix(q, 3);
          const note = k === 'comp' ? ' With perfect complements the Hicksian demand is vertical: the consumer just needs enough money to buy the old bundle, $CV = x_1\\,\\Delta p_1$.' : k === 'ql' ? ' Quasilinear: Hicksian and ordinary demand coincide, so CV is also the consumer-surplus area.' : '';
          return `$p_1$: 1 → ${v.fix(P, 2)}. Compensating variation $e(p', u_0) - m = ${f(CV)}$; the area under $h_1(\\cdot, u_0)$ between the prices, by Simpson's rule, is ${f(area)}. ${touch ? 'Your compensation matches it.' : `Your compensation $c = ${v.fix(C, 2)}$ is ${C < CV ? 'too small' : 'too large'}.`}${note}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10', kind: 'Definition', name: 'Equivalent variation',
      statement: String.raw`When prices change from $p^0$ to $p^1$, the **equivalent variation** is the change in income that, at the *old* prices, would have the same effect on the consumer's welfare as the price change:
$$EV = e(p^0, u_1) - e(p^0, u_0) = e(p^0, u_1) - m.$$
It is negative for a price rise (the most the consumer would pay to avoid it) and positive for a price cut (the income gain she would accept instead of it). When only $p_1$ changes, $EV = \int_{p_1^1}^{p_1^0} h_1(t, p_2, u_1)\,dt$, the area to the left of the Hicksian demand curve at the *new* utility. Because it values every outcome at the same (old) prices, EV is a money-metric utility: it ranks several alternative policies consistently, which CV does not.`,
      idea: String.raw`Instead of compensating the consumer after the change, ask what change in income at the old prices would put her on her new indifference curve: pull (or push) the old budget line parallel until it touches $u_1$. Its intercept change is $e(p^0, u_1) - m$. Plot the expenditure functions $e(p^0, \cdot)$ and $e(p^1, \cdot)$ against utility: both pass through income $m$, at $u_0$ and $u_1$ respectively, and CV and EV are the vertical distances from $m$ to the *other* curve at those two utility levels. For a normal good, the curves are closer together at lower utility, which is why $|EV| < |CV|$ after a price rise.`,
      caption: String.raw`Choose a price rise or a price cut for good 1 (it starts at 1; income 10). Slide the **income change at old prices** to move the dashed old-price budget line until it just touches the new indifference curve, or press the button. Right: the two expenditure functions against utility; the horizontal line is income $m$. The gold segment at $u_1$ is EV, the orange segment at $u_0$ is CV.`,
      deps: ['micro-6.9'], refs: ['Varian Ch. 14'], tags: ['welfare'],
      see: ['micro-5.12', 'micro-6.11'],
      credit: 'John Hicks, 1939–1943',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equivalent_variation' },
      viz(v) {
        const M = 10, P0 = 1, F = prefs('cd', { a: 0.5 });
        const dir = v.select('price of good 1', [{ value: 'up', label: 'rises' }, { value: 'down', label: 'falls' }], 'up');
        const size = v.slider('size of the change', 0.05, 0.8, 0.5, { step: 0.01 });
        const dd = v.slider('income change at old prices $\\Delta$', -6, 6, -1, { step: 0.01 });
        let evNow = 0;
        v.button('match exactly', () => dd.set(clamp(evNow, -6, 6)));
        const s = v.stage({ x: [0, 14], y: [0, 14], height: 360, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.1 });
        const e = v.stage({ x: [2, 9], y: [0, 20], height: 360, axes: 'box', xlabel: 'utility u', ylabel: 'money', title: 'expenditure functions $e(p^0, u)$ and $e(p^1, u)$' });
        v.legend([['muted', 'old budget', { dash: true }], ['accent', 'new budget'], ['gold', 'old prices, income m + Δ'], ['purple', 'u₀ (light) and u₁ (dark)'], ['gold', 'EV', {}], ['orange', 'CV', {}]]);
        let st = {};
        v.render(() => {
          const P = dir.value === 'up' ? P0 * (1 + size.value) : P0 * (1 - size.value), D = dd.value;
          const A = demand(F, P0, 1, M), u0 = F.u(...A), C = demand(F, P, 1, M), u1 = F.u(...C);
          const EV = hicks(F, P0, 1, u1).e - M, CV = hicks(F, P, 1, u0).e - M; evNow = EV;
          const touch = Math.abs(D - EV) < 0.03;
          bline(s, P0, 1, M, { color: 'muted', width: 1.6, dash: [7, 5] }); budget(s, P, 1, M, { fillAlpha: 0.06 });
          drawLevel(s, F, u0, { color: v.color('purple', 0.45), width: 1.6 }); drawLevel(s, F, u1, { color: 'purple', width: 2.6 });
          s.clip(() => s.line(M + D, 0, 0, M + D, { color: touch ? 'green' : 'gold', width: 2.6, dash: [7, 4] }));
          const Hb = hicks(F, P0, 1, u1).x;
          s.dot(A[0], A[1], { r: 5.5, color: 'ink', label: 'A', labelPos: 'ne' }); s.dot(C[0], C[1], { r: 6, color: 'accent', label: 'C', labelPos: 'ne' });
          s.dot(Hb[0], Hb[1], { r: 5.5, color: touch ? 'green' : 'gold', label: 'E', labelPos: 'sw' });
          s.corner(touch ? 'touches u₁: Δ = EV' : 'move the dashed line onto u₁', 'tr', { color: touch ? 'green' : 'muted', weight: 700 });
          // expenditure functions
          e.hline(M, { color: 'ink', width: 1.4, dash: [4, 3] }); e.text('income m', 2.1, M, { dy: -9, color: 'ink', size: 11.5, weight: 600, align: 'left' });
          e.fn((u) => hicks(F, P0, 1, u).e, { domain: [2, 9], color: 'muted', width: 2.4, n: 60 });
          e.fn((u) => hicks(F, P, 1, u).e, { domain: [2, 9], color: 'accent', width: 2.4, n: 60 });
          e.text('e(p⁰, u)', 8.9, hicks(F, P0, 1, 8.9).e, { dx: -4, dy: P > P0 ? 12 : -12, color: 'muted', ...LBL, align: 'right' });
          e.text("e(p¹, u)", 8.9, hicks(F, P, 1, 8.9).e, { dx: -4, dy: P > P0 ? -12 : 12, color: 'accent', ...LBL, align: 'right' });
          e.line(u1, M, u1, M + EV, { color: 'gold', width: 4 }); e.line(u0, M, u0, M + CV, { color: 'orange', width: 4 });
          e.vline(u0, GUIDE); e.vline(u1, GUIDE);
          e.text('EV', u1, M + EV / 2, { dx: -8, color: 'gold', ...LBL, align: 'right' }); e.text('CV', u0, M + CV / 2, { dx: 8, color: 'orange', ...LBL, align: 'left' });
          e.dot(u0, M, { r: 5, color: 'ink' }); e.dot(u1, M, { r: 5, color: 'accent' });
          st = { P, EV, CV, D, touch, u0, u1 };
        });
        v.readout(() => {
          const { P, EV, CV, D, touch } = st, f = (q) => v.fix(q, 3), up = P > 1;
          return `$p_1$: 1 → ${v.fix(P, 2)}. Equivalent variation $EV = e(p^0, u_1) - m = ${f(EV)}$; compensating variation $CV = e(p^1, u_0) - m = ${f(CV)}$ ${up ? '(a payment needed)' : '(negative: money the consumer could give up)'}. ${up ? `She would pay up to ${f(-EV)} to avoid the rise but needs ${f(CV)} to accept it` : `She values the cut like an income gain of ${f(EV)}, but would give up only ${f(-CV)} to keep it`}: for a normal good $|EV|$ and $|CV|$ differ, and EV is the larger *gain* measure. ${touch ? 'Your $\\Delta$ matches EV.' : `Your $\\Delta = ${v.fix(D, 2)}$.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11', kind: 'Proposition', name: 'Ranking CV, EV and consumer surplus',
      statement: String.raw`Let only $p_1$ change and let $\Delta CS = \int_{p_1^1}^{p_1^0} x_1(t)\,dt$ be the change in Marshallian consumer surplus, and write the welfare gains of the price change as $-CV$ ... in the "gain" convention: $CV^g = m - e(p^1, u_0)$ and $EV^g = e(p^0, u_1) - m$. If good 1 is **normal** over the range,
$$CV^g \;\le\; \Delta CS \;\le\; EV^g,$$
for price cuts and price rises alike, with equality throughout when there is no income effect on good 1 (quasilinear utility, 6.8). If good 1 is inferior the inequalities reverse. Willig (1976) showed that the differences are small when the income elasticity $\eta$ and the surplus relative to income are small: approximately $(\Delta CS - CV^g)/|\Delta CS| \approx \eta\,|\Delta CS|/(2m)$.`,
      idea: String.raw`The three measures are areas to the left of three demand curves between the same two prices (6.8–6.10): the Hicksian curve at $u_0$, the Marshallian curve, and the Hicksian curve at $u_1$. All three pass through the point of the Marshallian curve where utility equals their own level (duality, 5.11). For a price cut $u_1 > u_0$; for a normal good more utility means more of good 1 at any price, so $h_1(\cdot, u_0) \le x_1 \le h_1(\cdot, u_1)$ on the interval, and integrating (Rudin 6.21) orders the areas. On the indifference map the same fact appears as vertical gaps: EV is the gap between the two curves measured with lines of the old slope, CV with lines of the new slope, and they agree exactly when the curves are vertical translates.`,
      caption: String.raw`The price of good 1 changes from 1.5 (cut or rise, slider for the new price); utility is $3\ln x_1 + (x_2^{1-\eta} - 1)/(1 - \eta)$. Left: the old and new indifference curves with tangent lines of the old slope (gold, their vertical gap is EV) and of the new slope (orange, gap CV). Middle: the Marshallian demand and the two Hicksian demands, which bracket it. Bottom: the three measures against the new price. Turn on **quasilinear** (no income effect) and all three coincide.`,
      deps: ['micro-6.8', 'micro-6.9', 'micro-6.10', 'pma-6.21'], refs: ['Varian Ch. 14', 'Willig, AER 66(4), 1976'], tags: ['welfare'],
      see: ['micro-5.11'],
      credit: 'John Hicks, 1943; Robert Willig, 1976',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Consumer_surplus' },
      viz(v) {
        const M = 10, P0 = 1.5;
        const dir = v.select('price of good 1', [{ value: 'down', label: 'falls' }, { value: 'up', label: 'rises' }], 'down');
        const ql = v.toggle('quasilinear (no income effect)', false);
        const eta = v.slider('income effect $\\eta$', 0.05, 1, 0.8, { step: 0.01 });
        const pc = v.slider('new price as a share of the old', 0.3, 0.95, 0.45, { step: 0.01 });
        const s = v.stage({ x: [0, 16], y: [0, 14], height: 340, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.1, title: 'gaps between the two indifference curves' });
        const d = v.stage({ x: [0, 16], y: [0, 3.2], height: 340, axes: 'box', xlabel: 'x₁', ylabel: 'p₁', title: 'three demand curves, three areas' });
        const g = v.stage({ x: [0.3, 0.95], y: [0, 1], height: 180, axes: 'box', full: true, xlabel: 'size of the change: new price / old price (for a rise, old / new)', ylabel: 'gain', title: 'welfare gain measures: $CV \\le \\Delta CS \\le EV$ for a normal good' });
        v.legend([['orange', 'Hicksian at u₀ · CV'], ['accent', 'Marshallian · ΔCS'], ['gold', 'Hicksian at u₁ · EV'], ['purple', 'indifference curves']]);
        const cache = {};
        const measures = (F, Pn) => {
          const A = demand(F, P0, 1, M), u0 = F.u(...A), C = demand(F, Pn, 1, M), u1 = F.u(...C);
          const cs = simpson((p) => demand(F, p, 1, M)[0], Pn, P0, 60), cv = M - hicks(F, Pn, 1, u0).e, ev = hicks(F, P0, 1, u1).e - M;
          return { A, u0, C, u1, cs, cv, ev };
        };
        let st = {};
        v.render(() => {
          const e0 = ql.value ? 0 : eta.value; eta.el.hidden = ql.value;
          const F = prefs('ie', { a: 3, eta: e0 }), up = dir.value === 'up', Pn = up ? P0 / pc.value : P0 * pc.value;
          const r = measures(F, Pn), { A, u0, C, u1 } = r;
          drawLevel(s, F, u0, { color: 'purple', width: 2.2 }); drawLevel(s, F, u1, { color: 'purple', width: 2.2 });
          budget(s, Pn, 1, M, { fillAlpha: 0.05, width: 1.6 }); bline(s, P0, 1, M, { color: 'muted', width: 1.4, dash: [6, 4] });
          // tangent lines: old slope to the "other" curve (EV), new slope to the "other" curve (CV)
          const eOld = hicks(F, P0, 1, u1), eNew = hicks(F, Pn, 1, u0);
          s.clip(() => { s.line(eOld.e / P0, 0, 0, eOld.e, { color: 'gold', width: 2.2 }); s.line(eNew.e / Pn, 0, 0, eNew.e, { color: 'orange', width: 2.2 }); });
          const yt = (y) => Math.min(y, 13.8);
          s.line(0.25, M, 0.25, yt(eOld.e), { color: 'gold', width: 5 }); s.line(0.7, M, 0.7, yt(eNew.e), { color: 'orange', width: 5 });
          s.text('EV', 0.25, (M + yt(eOld.e)) / 2, { dx: -2, color: 'gold', ...LBL, align: 'right' }); s.text('CV', 0.9, (M + yt(eNew.e)) / 2, { color: 'orange', ...LBL, align: 'left' });
          s.dot(A[0], A[1], { r: 5, color: 'ink' }); s.dot(C[0], C[1], { r: 5.5, color: 'green' });
          // demand curves
          const lo = Math.min(P0, Pn), hi = Math.max(P0, Pn), ps = []; for (let i = 0; i <= 50; i++) ps.push(0.25 + (2.9 * i) / 50);
          const hk = (u) => (p) => hicks(F, p, 1, u).x[0], xd = (p) => demand(F, p, 1, M)[0];
          d.clip(() => {
            const reg = (fn) => { const q = []; for (let i = 0; i <= 24; i++) { const p = lo + ((hi - lo) * i) / 24; q.push([fn(p), p]); } return q; };
            d.poly([[0, lo], ...reg(hk(Math.max(u0, u1))), [0, hi]], { fill: 'gold', fillAlpha: 0.22, stroke: false });
            d.poly([[0, lo], ...reg(xd), [0, hi]], { fill: 'accent', fillAlpha: 0.16, stroke: false });
            d.poly([[0, lo], ...reg(hk(Math.min(u0, u1))), [0, hi]], { fill: 'orange', fillAlpha: 0.22, stroke: false });
            d.path(ps.map((p) => [hk(u0)(p), p]), { color: 'orange', width: 2.2, dash: [7, 4] }); d.path(ps.map((p) => [hk(u1)(p), p]), { color: 'gold', width: 2.2, dash: [7, 4] }); d.path(ps.map((p) => [xd(p), p]), { color: 'accent', width: 2.6 });
          });
          d.hline(P0, { color: 'muted', width: 1, dash: [3, 3] }); d.hline(Pn, { color: 'muted', width: 1, dash: [3, 3] });
          // measures against the size of the change
          const key = `${e0}|${up}`;
          if (!cache[key]) { const out = []; for (let i = 0; i <= 26; i++) { const sh = 0.3 + (0.65 * i) / 26, q = measures(F, up ? P0 / sh : P0 * sh); out.push([sh, q.cv, q.cs, q.ev]); } cache[key] = out; }
          const cv = cache[key], all = cv.flatMap((z) => z.slice(1)), gl = Math.min(0, ...all), gh = Math.max(0, ...all);
          g.setView([0.3, 0.95], [gl - 0.08 * (gh - gl), gh + 0.08 * (gh - gl)]);
          g.hline(0, { color: 'faint', width: 1 });
          [[1, 'orange'], [2, 'accent'], [3, 'gold']].forEach(([j, col]) => g.path(cv.map((z) => [z[0], z[j]]), { color: col, width: 2.4 }));
          g.vline(pc.value, GUIDE);
          st = { e0, up, Pn, ...r };
        });
        v.readout(() => {
          const { e0, up, Pn, cs, cv, ev } = st, f = (q) => v.fix(q, 3);
          const order = cv <= cs + 1e-9 && cs <= ev + 1e-9 ? 'so $CV \\le \\Delta CS \\le EV$' : 'ordered as stated';
          const will = e0 > 0 ? ` Willig's rule of thumb predicts a relative gap $(\\Delta CS - CV)/|\\Delta CS| \\approx \\eta\\,|\\Delta CS|/2m \\approx ${v.fix(100 * e0 * Math.abs(cs) / 20, 1)}\\%$ (income elasticity near the optimum ≈ ${v.fix(e0, 2)}); the actual gap is ${v.fix(100 * (cs - cv) / Math.abs(cs), 1)}%.` : ' With no income effect the three measures coincide, as 6.8 showed.';
          return `$p_1$: 1.5 → ${v.fix(Pn, 2)} (a price ${up ? 'rise: the gains are negative' : 'cut'}). Gains: $CV = ${f(cv)}$, $\\Delta CS = ${f(cs)}$, $EV = ${f(ev)}$, ${order}.${will}`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12', kind: 'Proposition', name: 'The substitution effect is never positive',
      statement: String.raw`Suppose choices satisfy the weak axiom of revealed preference (6.5), demand spends all income, and the price of good 1 rises from $p_1$ to $p_1'$ while income is adjusted to $m' = p'\cdot x(p, m)$, so the old bundle remains just affordable (Slutsky compensation). Then the compensated demand for good 1 does not rise: $x_1(p', m') \le x_1(p, m)$. More generally, for every compensated price change,
$$(p' - p)\cdot\big(x(p', m') - x(p, m)\big) \le 0,$$
the **compensated law of demand**. In the limit this is the negative semidefiniteness of the Slutsky matrix (6.2), and in particular $\partial h_1/\partial p_1 \le 0$.`,
      idea: String.raw`The pivoted budget line passes through the old bundle $A$ and is steeper. To the right of $A$ it lies inside the old budget set, so every bundle there was affordable when $A$ was chosen: $A$ is revealed preferred to it. If the consumer picked such a bundle $B$ on the new line, where $A$ is also affordable, $B$ would be revealed preferred to $A$ as well, a violation of WARP. So the choice must lie on the part of the new line with less good 1. For the general inequality, write $x = x(p, m)$, $x' = x(p', m')$: $p'\cdot x' = m' = p'\cdot x$, and WARP applied to $x$ affordable at $(p', m')$ gives $p\cdot x' > p\cdot x$ unless $x' = x$. Subtracting, $(p' - p)\cdot(x' - x) \le 0$. No utility function or calculus is needed; this is why the sign of the substitution effect is the one robust prediction of demand theory.`,
      caption: String.raw`**WARP argument**: raise the price of good 1 and the budget line pivots about the old choice $A$. The red part of the pivoted line was affordable before, so WARP forbids choosing there; drag the gold bundle $Q$ along the line to test. The green dot is the actual compensated choice. **Every direction**: price changes of fixed size in every direction $\theta$ around $p = (1, 1)$, each compensated; the curve plots $\Delta p\cdot\Delta x$, which must stay at or below zero. Choose the demand rule **share rises with own price** (no utility behind it): its choice lands in the forbidden part, and the curve rises above zero.`,
      deps: ['micro-6.1', 'micro-6.5'], refs: ['Varian Ch. 8'], tags: ['demand', 'revealed preference'],
      see: ['micro-6.2', 'micro-5.10'],
      credit: 'Paul Samuelson, 1938',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_demand' },
      viz(v) {
        const M = 10;
        const RULES = {
          cd: { label: 'Cobb–Douglas', dem: (p1, p2, m) => demand(prefs('cd', { a: 0.5 }), p1, p2, m) },
          ces: { label: 'CES, $\\sigma = 2$', dem: (p1, p2, m) => demand(prefs('ces', { a: 0.5, r: 0.5 }), p1, p2, m) },
          up: { label: 'share rises with own price', dem: (p1, p2, m) => { const s1 = p1 ** 3 / (p1 ** 3 + p2 ** 3); return [(s1 * m) / p1, ((1 - s1) * m) / p2]; } },
        };
        const mode = v.select('show', [{ value: 'warp', label: 'WARP argument' }, { value: 'dir', label: 'every direction' }], 'warp');
        const rule = v.select('demand', Object.entries(RULES).map(([value, o]) => ({ value, label: o.label })), 'cd');
        const pn = v.slider("new price $p_1'$", 1.05, 2.5, 1.7, { step: 0.01 });
        const sz = v.slider('size of the price change $|\\Delta p|$', 0.05, 0.6, 0.4, { step: 0.01 });
        const s = v.stage({ x: [0, 14], y: [0, 14], height: 370, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.1 });
        const g = v.stage({ x: [0, 360], y: [-1, 1], height: 370, axes: 'box', xlabel: 'direction θ of Δp = |Δp|(cos θ, sin θ), degrees', ylabel: 'Δp·Δx', xticks: [0, 90, 180, 270, 360], title: 'compensated law of demand: $\\Delta p\\cdot\\Delta x \\le 0$' });
        let tQ = 0.3;
        const Q = s.handle(6, 4, { color: 'gold', r: 6, label: 'Q', labelPos: 'ne', constrain: (x) => { st.k && (tQ = clamp(x / st.X1, 0.02, 0.98)); return st.k ? [tQ * st.X1, (1 - tQ) * st.Y1] : [x, 4]; } });
        let st = {};
        v.render(() => {
          const R = RULES[rule.value], P = pn.value, warpMode = mode.value === 'warp';
          pn.el.hidden = !warpMode; sz.el.hidden = warpMode;
          const A = R.dem(1, 1, M), mp = P * A[0] + A[1], B = R.dem(P, 1, mp), X1 = mp / P, Y1 = mp;
          st = { R, P, A, mp, B, X1, Y1, k: true };
          // map (both modes): old budget, pivoted line, forbidden part
          budget(s, 1, 1, M, { color: 'muted', fillAlpha: 0.08, width: 1.8, dash: [7, 5] });
          s.clip(() => { s.line(0, Y1, A[0], A[1], { color: 'green', width: 4, alpha: 0.75 }); s.line(A[0], A[1], X1, 0, { color: 'red', width: 4, alpha: 0.75 }); });
          s.text('forbidden by WARP', (A[0] + X1) / 2, A[1] / 2, { dx: 10, color: 'red', ...LBL, align: 'left', plate: true });
          const qx = tQ * X1, qy = (1 - tQ) * Y1; Q.x = qx; Q.y = qy;
          s.dot(A[0], A[1], { r: 6, color: 'ink', label: 'A', labelPos: 'ne' });
          const bad = B[0] > A[0] + 1e-9;
          s.dot(B[0], B[1], { r: 6.5, color: bad ? 'red' : 'green', label: 'B', labelPos: 'sw' });
          trimArrow(s, A, B, { color: bad ? 'red' : 'orange', width: 3, head: 10 });
          st.bad = bad; st.qbad = qx > A[0] + 1e-9;
          // every direction
          const D = sz.value, th = [], val = [];
          for (let d = 0; d <= 360; d += 2) { const t = (d * Math.PI) / 180, p1 = 1 + D * Math.cos(t), p2 = 1 + D * Math.sin(t), x0 = R.dem(1, 1, M), m2 = p1 * x0[0] + p2 * x0[1], x1 = R.dem(p1, p2, m2); th.push(d); val.push((p1 - 1) * (x1[0] - x0[0]) + (p2 - 1) * (x1[1] - x0[1])); }
          const vmin = Math.min(0, ...val), vmax = Math.max(0, ...val), pad = 0.15 * (vmax - vmin || 1);
          g.setView([0, 360], [vmin - pad, vmax + pad]);
          const at = (d) => val[clamp(Math.round(d / 2), 0, 180)];
          g.between((d) => Math.min(0, at(d)), () => 0, 0, 360, { fill: 'green', fillAlpha: 0.2, n: 180 });
          g.between((d) => Math.max(0, at(d)), () => 0, 0, 360, { fill: 'red', fillAlpha: 0.3, n: 180 });
          g.hline(0, { color: 'ink', width: 1.2 });
          g.path(th.map((d, i) => [d, val[i]]), { color: vmax > 1e-9 ? 'red' : 'green', width: 2.6 });
          for (const d of [45, 225]) g.text('p changes in proportion', d, 0, { dy: -10, color: 'muted', size: 10.5, weight: 600, align: 'center' });
          st.vmax = vmax; st.vmin = vmin; st.warpMode = warpMode;
        });
        v.readout(() => {
          const { P, A, B, bad, qbad, vmax, vmin, warpMode } = st, f = (q) => v.fix(q, 2);
          if (warpMode) return `$p_1$: 1 → ${f(P)} with Slutsky compensation, so $A = (${f(A[0])}, ${f(A[1])})$ stays affordable. Bundles on the pivoted line with more than ${f(A[0])} of good 1 were affordable at the old prices. The chosen $B = (${f(B[0])}, ${f(B[1])})$ ${bad ? '**is in the forbidden part: WARP is violated**, and compensated demand for good 1 rose' : `has less good 1: substitution effect ${sgn(B[0] - A[0])} ≤ 0`}. The test bundle $Q$ is ${qbad ? 'forbidden (red)' : 'allowed (green)'}.`;
          return vmax > 1e-9 ? `For some directions $\\Delta p\\cdot\\Delta x$ reaches ${v.fix(vmax, 3)} > 0: compensated demand moves *with* prices, so this rule violates WARP and no utility function produces it.` : `Every compensated price change of size ${v.fix(sz.value, 2)} gives $\\Delta p\\cdot\\Delta x \\le 0$ (most negative ${v.fix(vmin, 3)}); it is zero when both prices change in proportion, because then nothing real changes.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.13
    {
      num: '6.13', kind: 'Proposition', name: 'Endowment income effect',
      statement: String.raw`A consumer owns an endowment $\omega = (\omega_1, \omega_2)$ instead of a money income, so her budget is $p\cdot x = p\cdot\omega$ and the line pivots about $\omega$ when prices change. The Slutsky equation becomes
$$\frac{d x_1}{d p_1} = \frac{\partial h_1}{\partial p_1} + (\omega_1 - x_1)\,\frac{\partial x_1}{\partial m},$$
the substitution effect plus an income term weighted by her **net sales** $\omega_1 - x_1$ rather than by $-x_1$. The ordinary income effect $-x_1\,\partial x_1/\partial m$ is joined by an **endowment income effect** $\omega_1\,\partial x_1/\partial m$: when good 1 becomes dearer, the value of what she owns rises. For a net seller of a normal good the two income terms together raise her consumption, and if they outweigh the substitution effect she sells *less* at a higher price; the classic case is a backward-bending labour supply curve, with good 1 leisure and $p_1$ the wage.`,
      idea: String.raw`Income is now $m = p\cdot\omega$, so $x_1(p, p\cdot\omega)$ depends on $p_1$ twice: directly, and through income with $\partial m/\partial p_1 = \omega_1$. The chain rule (Rudin 9.15) gives $dx_1/dp_1 = \partial x_1/\partial p_1 + \omega_1\,\partial x_1/\partial m$, and substituting the ordinary Slutsky equation (6.2) for the first term gives the formula. On the map, Varian's decomposition takes three steps: pivot about the old choice $A$ (substitution, to $B$), shift in parallel to the old money income (ordinary income effect, to $C$), then shift out again by the increase in the endowment's value (endowment income effect, to $D$).`,
      caption: String.raw`Drag the endowment $\omega$ and raise the price of good 1 (it starts at 1, $p_2 = 1$). The orange arrow is the substitution effect, the teal arrow the ordinary income effect at the old money income, and the pink arrow the endowment income effect as the endowment gains value. The right panel is her net supply of good 1, $\omega_1 - x_1$, against its price. With **CES, σ = ½** and most of the endowment in good 1 the supply curve bends backward: a higher price makes her sell less. With Cobb–Douglas and $\omega_2 = 0$ net supply does not respond to price at all.`,
      deps: ['micro-6.2', 'micro-4.1'], refs: ['Varian Ch. 9'], tags: ['demand', 'endowments'],
      see: ['behav-2.9', 'micro-6.1'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Backward_bending_supply_curve_of_labour' },
      viz(v) {
        const FAM = { cesh: { label: 'CES, $\\sigma = \\tfrac12$', F: prefs('ces', { a: 0.5, r: -1 }) }, cd: { label: 'Cobb–Douglas', F: prefs('cd', { a: 0.5 }) }, ces2: { label: 'CES, $\\sigma = 2$', F: prefs('ces', { a: 0.5, r: 0.5 }) } };
        const fam = v.select('preferences', Object.entries(FAM).map(([value, o]) => ({ value, label: o.label })), 'cesh');
        const pn = v.slider("new price $p_1'$", 1.05, 3, 2, { step: 0.01 });
        const s = v.stage({ x: [0, 14], y: [0, 14], height: 370, axes: 'box', xlabel: 'x₁', ylabel: 'x₂', weight: 1.15 });
        const n = v.stage({ x: [-2, 10], y: [0.3, 3.2], height: 370, axes: 'box', xlabel: 'net sales of good 1, ω₁ − x₁', ylabel: 'p₁', title: 'net supply of good 1' });
        const W = s.handle(10, 1.5, { color: 'ink', r: 7, label: 'ω', labelPos: 'se', constrain: (x, y) => [clamp(x, 0.5, 13), clamp(y, 0, 13)] });
        v.legend([['muted', 'old budget', { dash: true }], ['accent', 'new budget through ω'], ['orange', 'substitution A → B'], ['teal', 'ordinary income B → C'], ['pink', 'endowment income C → D']]);
        let st = {};
        v.render(() => {
          const F = FAM[fam.value].F, P = pn.value, w = [W.x, W.y], m0 = w[0] + w[1], m1 = P * w[0] + w[1];
          const A = demand(F, 1, 1, m0), B = demand(F, P, 1, P * A[0] + A[1]), C = demand(F, P, 1, m0), D = demand(F, P, 1, m1);
          bline(s, 1, 1, m0, { color: 'muted', width: 1.6, dash: [7, 5] });
          s.clip(() => s.line((P * A[0] + A[1]) / P, 0, 0, P * A[0] + A[1], { color: 'orange', width: 1.4, dash: [5, 4] }));
          s.clip(() => s.line(m0 / P, 0, 0, m0, { color: 'teal', width: 1.4, dash: [5, 4] }));
          budget(s, P, 1, m1, { fillAlpha: 0.06 });
          drawLevel(s, F, F.u(...A), { color: v.color('purple', 0.5), width: 1.5 }); drawLevel(s, F, F.u(...D), { color: 'purple', width: 2.2 });
          trimArrow(s, A, B, { color: 'orange', width: 3, head: 10 }); trimArrow(s, B, C, { color: 'teal', width: 3, head: 10 }); trimArrow(s, C, D, { color: 'pink', width: 3, head: 10 });
          s.dot(A[0], A[1], { r: 5.5, color: 'ink', label: 'A', labelPos: 'ne' }); s.dot(B[0], B[1], { r: 5, color: 'orange', label: 'B', labelPos: 'nw' });
          s.dot(C[0], C[1], { r: 5, color: 'teal', label: 'C', labelPos: 'sw' }); s.dot(D[0], D[1], { r: 6, color: 'green', label: 'D', labelPos: 'se' });
          // net supply curve
          const ps = []; for (let i = 0; i <= 80; i++) ps.push(0.3 + (2.9 * i) / 80);
          const ns = ps.map((p) => w[0] - demand(F, p, 1, p * w[0] + w[1])[0]);
          n.setView([Math.min(-1, ...ns) - 0.5, Math.max(w[0], ...ns) + 0.5], [0.3, 3.2]);
          n.vline(0, { color: 'faint', width: 1 });
          n.path(ps.map((p, i) => [ns[i], p]), { color: 'accent', width: 2.6 });
          for (let i = 1; i < ps.length; i++) if (ns[i] < ns[i - 1] - 1e-9 && ns[i] > 0) n.line(ns[i - 1], ps[i - 1], ns[i], ps[i], { color: 'red', width: 5, alpha: 0.5 });
          n.dot(w[0] - A[0], 1, { r: 5.5, color: 'ink', label: 'A', labelPos: 'ne' }); n.dot(w[0] - D[0], P, { r: 6, color: 'green', label: 'D', labelPos: 'ne' });
          n.hline(1, { color: 'muted', width: 1, dash: [3, 3] }); n.hline(P, { color: 'muted', width: 1, dash: [3, 3] });
          // derivative check at the old price
          const sl = slutsky(F, 1, 1, m0), h = 1e-4, tot = (demand(F, 1 + h, 1, (1 + h) * w[0] + w[1])[0] - demand(F, 1 - h, 1, (1 - h) * w[0] + w[1])[0]) / (2 * h);
          st = { P, w, A, B, C, D, sl, tot };
        });
        v.readout(() => {
          const { P, w, A, B, C, D, sl, tot } = st, f = (q) => v.fix(q, 2), f3 = (q) => v.fix(q, 3);
          const sells = w[0] - A[0] > 0, end = sl.dm * w[0];
          const check = `At $p_1 = 1$: $dx_1/dp_1 = ${f3(tot)}$ directly, and $\\partial h_1/\\partial p_1 + (\\omega_1 - x_1)\\,\\partial x_1/\\partial m = ${f3(sl.dh)} + (${f(w[0] - A[0])})(${f3(sl.dm)}) = ${f3(sl.dh + (w[0] - A[0]) * sl.dm)}$.`;
          const story = sells ? `She is a net seller of good 1 (${f(w[0] - A[0])} units at $p_1 = 1$). After the rise to ${f(P)} she sells ${f(w[0] - D[0])}: ${w[0] - D[0] < w[0] - A[0] ? '**less**, because the endowment income effect outweighs the substitution effect' : 'more, because the substitution effect dominates'}.` : 'She is a net buyer of good 1, so the price rise makes her poorer and both income effects push the same way as for a money income.';
          return `$p_1$: 1 → ${f(P)}. Substitution ${sgn(B[0] - A[0])}, ordinary income ${sgn(C[0] - B[0])}, endowment income ${sgn(D[0] - C[0])}: total change in $x_1$ ${sgn(D[0] - A[0])}. ${story} ${check} (Endowment term $\\omega_1\\,\\partial x_1/\\partial m = ${f3(end)}$.)`;
        });
      },
    },
  ],
};
