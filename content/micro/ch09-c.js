// Microeconomics — Chapter 9: General equilibrium and welfare (items 9.12–9.16; 9.1–9.6 in ch09.js, 9.7–9.11 in ch09-b.js, 9.17–9.21 in ch09-d.js)
import { clamp, GUIDE, bisect, argmax, plateText, bar, W1, W2, pref, market, contractCurve, boxStage, drawBox, nearestOnPath, f2, slopeSeg, slopeLine, dif } from './ch09.shared.js';

const cd = (a) => pref('cd', { a });

export default {
  collection: 'micro',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.12
    {
      num: '9.12', kind: 'Model', name: 'Robinson Crusoe economy',
      statement: String.raw`**Robinson Crusoe** has $T$ hours, which he divides between leisure $\ell$ and labour $L = T - \ell$, and gathers $c = f(L)$ coconuts, where $f$ is increasing and concave. His preferences are over leisure and coconuts, $u(\ell, c)$. Treat him as two agents: **Crusoe the firm** takes the wage $w$ (in coconuts per hour) as given and hires labour to maximise profit $\pi = f(L) - wL$, so $f'(L) = w$; **Crusoe the consumer** owns the firm and has income $wT + \pi$, so he chooses $(\ell, c)$ on the budget line $c = w(T - \ell) + \pi$, with $MRS_{\ell c} = w$. A **competitive equilibrium** is a wage at which the labour the firm wants equals the labour the consumer supplies. At that wage the two plans coincide with the planner's choice, the point of the production frontier $c = f(T - \ell)$ on the highest indifference curve, where $MRS = f'(L)$.`,
      idea: String.raw`The budget line of the consumer and the iso-profit line of the firm are the same line: it passes through $(\ell, c) = (T, \pi)$ (no labour, just profit) with slope $-w$. The firm moves to the point of the frontier where that line is tangent, which maximises $\pi$; the consumer moves to the point of the line where an indifference curve is tangent. For most wages these are different points, and the gap is excess demand or supply of labour. When they coincide the line is tangent to both the frontier and the indifference curve, which is the first-order condition of the planner's problem $\max u(T - L, f(L))$: the market solves the planning problem without anyone computing it. This is the one-consumer prototype of 9.9 and 9.14.`,
      caption: String.raw`The curve is the production frontier $c = A\sqrt{T - \ell}$; **slide the wage**. The black line is both the firm's iso-profit line and the consumer's budget line. Orange: the firm's profit-maximising point (tangent to the frontier); green: the consumer's point (tangent to the purple indifference curve). When they differ, the red segment is the labour imbalance. The button jumps to the market-clearing wage, where the two dots merge and the tangency also solves the planner's problem (readout). Change productivity or the taste for leisure and the equilibrium moves.`,
      deps: ['micro-8.2', 'micro-5.2'],
      see: ['micro-9.14'],
      refs: ['Varian Ch. 33'], tags: ['general equilibrium', 'production'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Robinson_Crusoe_economy' },
      viz(v) {
        const T = 10;
        const wS = v.slider('wage $w$ (coconuts per hour)', 0.2, 3, 1.4, { step: 0.01 });
        const AS = v.slider('productivity $A$ in $c = A\\sqrt{L}$', 2, 6, 4, { step: 0.1 });
        const aS = v.slider('taste for leisure $a$ in $u = \\ell^a c^{1-a}$', 0.25, 0.75, 0.5, { step: 0.01 });
        const s = v.stage({ x: [0, T], y: [0, 22], axes: 'box', gutter: true, height: 430, xlabel: 'leisure ℓ (hours)   ←  labour L = T − ℓ  ', ylabel: 'coconuts c', title: 'Crusoe the firm and Crusoe the consumer', full: true });
        v.legend([['ink', 'production frontier c = f(T − ℓ)'], ['ink', 'iso-profit = budget line (slope −w)'], ['purple', 'indifference curve'], ['orange', 'firm’s choice'], ['green', 'consumer’s choice'], ['red', 'labour imbalance']]);
        const model = (w, A, a) => {
          const f = (L) => A * Math.sqrt(Math.max(L, 0)), Ld = (A / (2 * w)) ** 2, pi = f(Ld) - w * Ld, I = w * T + pi;
          let l = (a * I) / w; if (l > T) l = T;
          return { f, Ld, pi, l, c: I - w * l, Ls: T - l };
        };
        const equil = (A, a) => bisect((w) => { const m = model(w, A, a); return m.Ld - m.Ls; }, 0.05, 20) ?? 1;
        v.button('Go to the market-clearing wage', () => wS.set(clamp(equil(AS.value, aS.value), 0.2, 3)));
        let st = {};
        v.render(() => {
          const w = wS.value, A = AS.value, a = aS.value, m = model(w, A, a), u = (l, c) => l ** a * c ** (1 - a);
          s.setView([0, T], [0, Math.max(22, 1.08 * (A * Math.sqrt(T)))]);
          s.fn((l) => m.f(T - l), { domain: [0, T], color: 'ink', width: 3 });
          const lf = T - m.Ld, cf = m.f(m.Ld), u0 = u(m.l, m.c);
          s.line(0, m.pi + w * T, T, m.pi, { color: 'ink', width: 2.4 });
          s.fn((l) => (u0 / l ** a) ** (1 / (1 - a)), { domain: [0.05, T], color: 'purple', width: 2.4 });
          s.dot(T, m.pi, { r: 5, color: 'gold', hollow: true }); s.text('(T, π)', T, m.pi, { dx: -8, dy: -12, size: 11.5, color: 'muted', align: 'right', weight: 600 });
          const clears = Math.abs(m.Ld - m.Ls) < 0.03;
          if (!clears) s.line(lf, cf, m.l, m.c, { color: 'red', width: 2.6, dash: [4, 3] });
          s.dot(lf, cf, { r: 7.5, color: clears ? 'green' : 'orange' }); s.dot(m.l, m.c, { r: 6, color: 'green' });
          plateText(s, clears ? 'market clears' : 'firm', lf, cf, { dy: -15, color: clears ? 'green' : 'orange', align: 'center' });
          if (!clears) plateText(s, 'consumer', m.l, m.c, { dy: 16, color: 'green', align: 'center' });
          const we = equil(A, a), me = model(we, A, a);
          // planner: maximise u(T − L, f(L)) over L
          const pl = argmax((L) => u(T - L, m.f(L)), 0.01, T - 0.01, 200, 70);
          st = { w, m, clears, we, me, pl, mrs: (a / (1 - a)) * (m.c / m.l), mp: A / (2 * Math.sqrt(m.Ld)) };
        });
        v.readout(() => {
          const { w, m, clears, we, me, pl, mrs, mp } = st;
          return `At $w = ${f2(w)}$: the firm hires $L^d = ${f2(m.Ld)}$ hours ($f'(L) = ${f2(mp)} = w$), makes ${f2(m.f(m.Ld))} coconuts and profit $\\pi = ${f2(m.pi)}$. The consumer, with income $wT + \\pi = ${f2(w * 10 + m.pi)}$, takes $\\ell = ${f2(m.l)}$ hours of leisure and ${f2(m.c)} coconuts ($MRS = ${f2(mrs)}$), so supplies $${f2(m.Ls)}$ hours of labour. ${clears ? '**The labour market clears.**' : m.Ls > m.Ld ? 'Labour is in excess supply: the wage should fall.' : 'Labour is in excess demand: the wage should rise.'}\nEquilibrium wage $w^* = ${f2(we, 3)}$ with $L^* = ${f2(me.Ld, 3)}$; the planner's best $L$ (maximising $u$ on the frontier) is $${f2(pl.x, 3)}$, the same.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.13
    {
      num: '9.13', kind: 'Concept', name: 'Utility possibility frontier and social welfare',
      statement: String.raw`The **utility possibility frontier** (UPF) of an exchange economy is the set of utility pairs $(u_A, u_B)$ reached by Pareto-efficient allocations: the contract curve of 9.3 re-plotted in utility space. It slopes down (a Pareto improvement cannot exist), and every feasible allocation gives a point on or below it. A **social welfare function** $W(u_A, u_B)$ ranks utility pairs; three classical choices are the **utilitarian** $W = \lambda u_A + (1-\lambda) u_B$, the **Rawlsian** $W = \min(u_A, u_B)$ and the **Nash** product $W = u_A u_B$. Among efficient allocations the welfare-maximising one is where an indifference curve of $W$ touches the frontier. Efficiency (9.2) alone cannot choose among the points of the frontier; the choice needs a judgement about distribution.`,
      idea: String.raw`Efficiency is silent on how the gains are shared: all points of the UPF are efficient, and the market plus transfers (9.10) can reach any of them. A welfare function adds the missing ethical judgement as a family of level curves in utility space: straight lines of slope $-\lambda/(1-\lambda)$ for utilitarian welfare, which care about the sum; right angles at the 45° line for the Rawlsian, which cares only about the worst-off; hyperbolas for Nash, whose maximiser does not change when either utility is rescaled (it needs no comparison of the traders' utility units). Cardinal utility numbers matter for the first two: changing the units of $A$'s utility changes where they land, though it changes no behaviour.`,
      caption: String.raw`Left: the box with the contract curve; **drag the black point along it**. Right: the same allocation as a point on the utility possibility frontier (below it is the feasible but inefficient region). Pick a social welfare function: its level curves are drawn through the welfare-maximising point (gold, also shown in the box). Then **change the units of $A$'s utility** with the last slider: the utilitarian and Rawlsian optima move along the contract curve, the Nash one does not.`,
      deps: ['micro-9.3'],
      refs: ['Varian Ch. 34'], tags: ['welfare', 'equity'],
      credit: 'A. Bergson, 1938 (social welfare function); J. Nash, 1950 (Nash product); J. Rawls, 1971 (maximin)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Utility%E2%80%93possibility_frontier' },
      viz(v) {
        const sel = v.select('social welfare function', [{ value: 'util', label: 'utilitarian' }, { value: 'rawls', label: 'Rawlsian (max-min)' }, { value: 'nash', label: 'Nash product' }], 'util');
        const wS = v.slider('weight $\\lambda$ on $A$ (utilitarian)', 0.1, 0.9, 0.5, { step: 0.01 });
        const kS = v.slider('units of $A$’s utility (× $u_A$)', 0.5, 4, 1, { log: true, sig: 2 });
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.65, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const R = boxStage(v, { title: 'allocations on the contract curve', height: 390, weight: 1 });
        const U = v.stage({ x: [0, 10], y: [0, 10.5], axes: 'box', gutter: true, height: 390, xlabel: 'utility of A (in chosen units)', ylabel: 'utility of B', title: 'the utility possibility frontier', weight: 1 });
        v.legend([['purple', 'contract curve = UPF'], ['ink', 'chosen allocation'], ['gold', 'welfare-maximising point'], ['blue', 'social welfare level curves', { dash: true }]]);
        wS.el.hidden = false;
        const H = R.handle(4, 4, { color: 'ink', r: 8, label: 'x', labelPos: 'ne', constrain: (x, y) => nearestOnPath(R, curveNow(), x, y) });
        let curveNow = () => [[0, 0], [W1, W2]], key = '';
        const refresh = () => { const k = `${aS.value}|${bS.value}`; if (k !== key) { key = k; const c = contractCurve(cd(aS.value), cd(bS.value), 150); curveNow = () => c; } };
        let st = {};
        v.render(() => {
          refresh(); wS.el.hidden = sel.value !== 'util';
          const FA = cd(aS.value), FB = cd(bS.value), cur = curveNow(), k = kS.value, mode = sel.value, lam = wS.value;
          const pts = cur.map((p) => [k * FA.u(p[0], p[1]), FB.u(W1 - p[0], W2 - p[1])]);
          const SW = (x, y) => (mode === 'util' ? lam * x + (1 - lam) * y : mode === 'rawls' ? Math.min(x, y) : x * y);
          let bi = 0; pts.forEach((q, i) => { if (SW(q[0], q[1]) > SW(pts[bi][0], pts[bi][1])) bi = i; });
          const xs = 10 * k; U.setView([0, xs * 1.02], [0, 10.5]);
          drawBox(R);
          R.path(cur, { color: 'purple', width: 3.2 });
          U.poly([...pts, [xs, 0], [0, 0]], { fill: 'purple', fillAlpha: 0.08, stroke: false });
          U.path(pts, { color: 'purple', width: 3.2 });
          // level curves of the social welfare function through the optimum
          const opt = pts[bi], lvl = SW(opt[0], opt[1]);
          for (const f of [0.55, 0.8, 1]) {
            const c = lvl * f;
            if (mode === 'util') U.line(0, c / (1 - lam), c / lam, 0, { color: 'blue', width: f === 1 ? 2 : 1.3, dash: [6, 4], alpha: f === 1 ? 0.95 : 0.55 });
            else if (mode === 'rawls') U.path([[c, 12], [c, c], [xs * 1.1, c]], { color: 'blue', width: f === 1 ? 2 : 1.3, dash: [6, 4], alpha: f === 1 ? 0.95 : 0.55 });
            else U.fn((x) => c / x, { domain: [c / 12, xs * 1.05], color: 'blue', width: f === 1 ? 2 : 1.3, dash: [6, 4], alpha: f === 1 ? 0.95 : 0.55 });
          }
          const hq = nearestOnPath(R, cur, H.x, H.y); H.set(hq[0], hq[1]);
          const hx = k * FA.u(hq[0], hq[1]), hy = FB.u(W1 - hq[0], W2 - hq[1]);
          U.dot(hx, hy, { r: 7, color: 'ink' }); U.dot(opt[0], opt[1], { r: 8, color: 'gold' });
          R.dot(cur[bi][0], cur[bi][1], { r: 8, color: 'gold' }); R.dot(hq[0], hq[1], { r: 6, color: 'ink' });
          plateText(U, 'max W', opt[0], opt[1], { dx: 10, dy: -14, color: 'gold', align: 'left' });
          st = { hx, hy, opt, bi, cur, mode, sw: SW(hx, hy), swo: lvl, k };
        });
        v.readout(() => {
          const { hx, hy, opt, bi, cur, mode, sw, swo, k } = st;
          const name = mode === 'util' ? 'utilitarian welfare' : mode === 'rawls' ? 'the worst-off utility' : 'the Nash product';
          return `Chosen allocation: $(u_A, u_B) = (${f2(hx)}, ${f2(hy)})$, giving ${name} $= ${f2(sw)}$. The best point of the frontier has $(u_A, u_B) = (${f2(opt[0])}, ${f2(opt[1])})$ and welfare ${f2(swo)}; it is the allocation $A = (${f2(cur[bi][0])}, ${f2(cur[bi][1])})$ in the box. Units of $u_A$ are multiplied by ${f2(k)}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.14
    {
      num: '9.14', kind: 'Principle', name: 'Efficiency with production: MRS equals MRT',
      statement: String.raw`In an economy that can produce two goods along a production possibility frontier and has one (representative) consumer, an allocation $(x_1, x_2)$ on the frontier is Pareto efficient (maximises welfare) when the consumer's marginal rate of substitution equals the frontier's marginal rate of transformation,
$$MRS_{12}(x_1, x_2) = MRT_{12}(x_1, x_2).$$
With many consumers, all of them must share a common MRS equal to the MRT (the efficiency conditions MRS$^A$ = MRS$^B$ = MRT). If the consumer and the firm face the same relative price $p_1/p_2$, the market delivers it: the consumer chooses $MRS = p_1/p_2$ and the profit-maximising firm chooses $MRT = p_1/p_2$. A tax wedge between the consumer's and the producer's price, $p^c = (1+t)\,p^p$, makes the market equilibrium satisfy $MRS = (1+t)\,MRT$ and is inefficient.`,
      idea: String.raw`Moving along the frontier by $dx_1$ trades $MRT$ units of good 2 for one unit of good 1 in production; the consumer would give up $MRS$ units of good 2 for it. If $MRS > MRT$ the consumer values good 1 more than it costs to produce it in terms of good 2, so shifting resources toward good 1 raises utility; if $MRS < MRT$ the opposite. Welfare on the frontier therefore peaks exactly where the indifference curve is tangent to the frontier (first-order condition of constrained maximisation, 5.4). A price line tangent there is the budget line of the consumer and the iso-revenue line of the producer at once, the logic of 9.12 and 9.9. A tax wedge makes the two decision makers read different prices, so the equilibrium sits off the tangency.`,
      caption: String.raw`The curve is the frontier $x_1^2 + x_2^2 = 100$ ($MRT = x_1/x_2$); the purple curve is the indifference curve through the chosen point. **Drag the point along the frontier**: right, the utility along the frontier peaks where the two slopes agree. Then turn on the **market with a tax wedge** $t$ on good 1: producers face the price $p$ and consumers $(1+t)p$; the market settles at $MRS = (1+t)\,MRT$, below the peak, and the readout gives the welfare lost.`,
      deps: ['micro-9.12', 'micro-1.5', 'micro-4.11'],
      refs: ['Varian Ch. 33'], tags: ['general equilibrium', 'efficiency'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginal_rate_of_transformation' },
      viz(v) {
        const aS = v.slider('taste: weight on good 1', 0.2, 0.8, 0.5, { step: 0.01 });
        const tS = v.slider('tax wedge $t$ on good 1', 0, 1, 0.4, { step: 0.01 });
        const mk = v.toggle('market chooses (with the wedge)', false);
        const R = 10;
        const s = v.stage({ x: [0, 11.5], y: [0, 11.5], equal: true, axes: 'box', gutter: true, height: 400, xlabel: 'good 1', ylabel: 'good 2', title: 'production frontier and indifference curve', weight: 1.1 });
        const G = v.stage({ x: [0, Math.PI / 2], y: [0, 10], axes: 'box', gutter: true, height: 400, xlabel: 'position on the frontier (more good 1 →)', ylabel: 'utility', title: 'welfare along the frontier', weight: 0.9, minWidth: 260, xticks: [[0, 'only 2'], [Math.PI / 4, ''], [Math.PI / 2 - 0.15, 'only 1']] });
        v.legend([['ink', 'production frontier'], ['purple', 'indifference curve'], ['orange', 'MRT tangent'], ['accent', 'MRS tangent'], ['green', 'welfare maximum']]);
        const pt = (ph) => [R * Math.sin(ph), R * Math.cos(ph)];
        const H = s.handle(...pt(0.7), { color: 'gold', r: 9, label: 'x', labelPos: 'ne', constrain: (x, y) => { const ph = clamp(Math.atan2(x, y), 0.03, Math.PI / 2 - 0.03); return pt(ph); } });
        let st = {};
        v.render(() => {
          const a = aS.value, t = tS.value, U = (ph) => { const [x, y] = pt(ph); return x ** a * y ** (1 - a); };
          const mrsAt = (ph) => { const [x, y] = pt(ph); return (a / (1 - a)) * (y / x); }, mrtAt = (ph) => Math.tan(ph);
          const phMax = argmax(U, 0.02, Math.PI / 2 - 0.02, 120, 60).x;
          const phMkt = bisect((ph) => mrsAt(ph) - (1 + t) * mrtAt(ph), 0.02, Math.PI / 2 - 0.02) ?? phMax;
          if (mk.value) { const q = pt(phMkt); H.set(q[0], q[1]); }
          const ph = clamp(Math.atan2(H.x, H.y), 0.03, Math.PI / 2 - 0.03), [x, y] = pt(ph), u0 = U(ph);
          s.curve((q) => pt(q), 0, Math.PI / 2, { n: 160, color: 'ink', width: 3 });
          s.fn((xx) => (u0 / xx ** a) ** (1 / (1 - a)), { domain: [0.2, 11.5], color: 'purple', width: 2.4 });
          const mrt = mrtAt(ph), mrs = mrsAt(ph);
          slopeSeg(s, x, y, mrt, 70, { color: 'orange', width: 2.6 }); slopeSeg(s, x, y, mrs, 52, { color: 'accent', width: 2.6, alpha: 0.9 });
          const pm = pt(phMax); s.dot(pm[0], pm[1], { r: 7, color: 'green', hollow: true });
          s.dot(x, y, { r: 7, color: 'gold' });
          G.fn((q) => U(q), { domain: [0.02, Math.PI / 2 - 0.02], color: 'purple', width: 2.8, n: 160 });
          G.vline(phMax, { color: 'green', width: 1.4, dash: [4, 4] }); G.dot(phMax, U(phMax), { r: 7, color: 'green' });
          G.dot(ph, u0, { r: 7, color: 'gold' });
          if (mk.value) plateText(G, 'market', ph, u0, { dy: 17, color: 'gold', align: 'center' });
          st = { x, y, mrs, mrt, u0, um: U(phMax), t, mkt: mk.value, ph, phMax };
        });
        v.readout(() => {
          const { x, y, mrs, mrt, u0, um, t, mkt } = st;
          const rel = mrs / mrt;
          return `At $(${f2(x)}, ${f2(y)})$: $MRT = ${f2(mrt)}$, $MRS = ${f2(mrs)}$, ratio $MRS/MRT = ${f2(rel)}$ ${Math.abs(rel - 1) < 0.02 ? '(equal: the efficient point)' : rel > 1 ? '(good 1 is worth more to the consumer than it costs: produce more of it)' : '(good 1 costs more than it is worth: produce less)'}. Utility $${f2(u0)}$ against the maximum $${f2(um)}$ (a loss of **${f2((1 - u0 / um) * 100, 2)}%**).${mkt ? ` With the wedge $t = ${f2(t)}$ the market settles at $MRS/MRT = 1 + t = ${f2(1 + t)}$.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.15
    {
      num: '9.15', kind: 'Model', name: 'Heckscher–Ohlin model',
      statement: String.raw`Two countries have the same technologies and tastes but different endowments of two factors, labour $L$ and capital $K$. Two goods are produced with constant returns: good $X$ is **capital-intensive** and good $Y$ **labour-intensive** at all factor prices. Consumers have identical homothetic preferences. The **Heckscher–Ohlin theorem**: under free trade each country **exports the good that uses intensively the factor in which it is relatively abundant**; the capital-abundant country exports $X$ and imports $Y$. (Behind it, the autarky price of the good that uses the abundant factor intensively is lower.) In the example below $X = L^{0.3}K^{0.7}$, $Y = L^{0.7}K^{0.3}$ and utility is $X^{1/2}Y^{1/2}$.`,
      idea: String.raw`A country that has a lot of capital can make more of the capital-intensive good $X$ than of $Y$ before diminishing returns set in, so its production frontier bulges toward $X$ (Rybczynski). With the same tastes everywhere, that bulge makes $X$ cheap in autarky: the capital-abundant country has the lower autarky price of $X$. Opening trade equalises prices at a level in between, so the capital-abundant country faces a higher price of $X$ than before: it moves its production toward $X$, consumes more of $Y$ than it makes, and exports $X$. The computation below finds each frontier by solving the factor allocation exactly (equal marginal rates of technical substitution, 7.3), the autarky equilibrium from the tangency of the frontier with an indifference curve, and the free-trade price by clearing the world market.`,
      caption: String.raw`Two panels, **Home** and **Foreign**, each a production frontier built from the factor allocation. **Slide Home's share of the world's capital** (labour is split equally): at $0.5$ the countries are identical and no trade occurs; with more capital Home's frontier leans toward $X$. In **Autarky** each country consumes at the tangency with its indifference curve (price line slope = autarky price). In **Free trade** the common price line shows the production point (orange) and the consumption point (green) linked by the trade triangle: the capital-abundant country exports $X$.`,
      deps: ['micro-1.11', 'micro-7.3', 'micro-9.14'],
      see: ['micro-9.16'],
      refs: ['CORE Unit 18'], tags: ['trade', 'general equilibrium'],
      credit: 'E. Heckscher, 1919; B. Ohlin, 1933 (modern form: P. Samuelson, 1948)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heckscher%E2%80%93Ohlin_model' },
      viz(v) {
        const sK = v.slider('Home’s share of world capital', 0.2, 0.8, 0.65, { step: 0.01 });
        const mode = v.select('regime', [{ value: 'aut', label: 'Autarky' }, { value: 'trade', label: 'Free trade' }], 'trade');
        const a = 0.3, b = 0.7, th = 0.5, XM = 2.3;
        const mkStage = (title) => v.stage({ x: [0, XM], y: [0, XM], equal: true, axes: 'box', gutter: true, height: 380, xlabel: 'good X (capital-intensive)', ylabel: 'good Y (labour-intensive)', title, weight: 1, minWidth: 270 });
        const SH = mkStage('Home'), SF = mkStage('Foreign');
        v.legend([['ink', 'production frontier'], ['purple', 'indifference curve'], ['ink', 'price line', { dash: true }], ['orange', 'production'], ['green', 'consumption']]);
        /** A country with endowments (L, K): pointAt(lx) = (X, Y) when lx units of labour (and the capital that equalises MRTS) go to X. */
        const country = (L, K) => {
          const pointAt = (lx) => {
            if (lx <= 0) return [0, L ** b * K ** (1 - b)];
            if (lx >= L) return [L ** a * K ** (1 - a), 0];
            const kx = ((b / (1 - b)) * K) / (((a / (1 - a)) * (L - lx)) / lx + b / (1 - b));
            return [lx ** a * kx ** (1 - a), (L - lx) ** b * (K - kx) ** (1 - b)];
          };
          const P = Array.from({ length: 121 }, (_, i) => pointAt((L * i) / 120));
          /** production at relative price p (price of X in units of Y): maximise pX + Y over the frontier */
          const produce = (p) => pointAt(argmax((lx) => { const q = pointAt(lx); return p * q[0] + q[1]; }, 0, L, 80, 50).x);
          return { L, K, P, produce };
        };
        const consume = (X0, Y0, p) => { const I = p * X0 + Y0; return [(th * I) / p, (1 - th) * I]; };
        const cache = {};
        const solve = (sk) => {
          const key = sk.toFixed(4); if (cache[key]) return cache[key];
          const CH = country(1, 2 * sk), CF = country(1, 2 * (1 - sk));
          const exX = (C, p) => { const q = C.produce(p), c = consume(q[0], q[1], p); return c[0] - q[0]; };
          const autP = (C) => bisect((p) => exX(C, p), 0.05, 20, 60);
          const pH = autP(CH), pF = autP(CF);
          const pw = bisect((p) => exX(CH, p) + exX(CF, p), 0.05, 20, 60);
          return (cache[key] = { CH, CF, pH, pF, pw });
        };
        let st = {};
        v.render(() => {
          const sk = sK.value, R = solve(sk), trade = mode.value === 'trade';
          const drawC = (S, C, pa) => {
            S.path(C.P, { color: 'ink', width: 3 });
            const p = trade ? R.pw : pa, q = C.produce(p), c = consume(q[0], q[1], p), u0 = c[0] ** th * c[1] ** (1 - th);
            S.fn((x) => (u0 / x ** th) ** (1 / (1 - th)), { domain: [0.05, XM], color: 'purple', width: 2.4 });
            // price line through the production point
            slopeLine(S, q[0], q[1], -p, 130, { color: 'ink', width: 1.8, dash: [6, 4] });
            S.dot(q[0], q[1], { r: 7, color: 'orange' });
            S.dot(c[0], c[1], { r: 7, color: 'green' });
            if (trade && Math.hypot(S.X(q[0]) - S.X(c[0]), S.Y(q[1]) - S.Y(c[1])) > 10) { S.line(q[0], q[1], c[0], q[1], { color: 'muted', width: 1.4 }); S.line(c[0], q[1], c[0], c[1], { color: 'muted', width: 1.4 }); }
            S.corner(`${trade ? 'world' : 'autarky'} price of X: ${f2(p, 3)}`, 'tr', { plate: true, weight: 600 });
            return { q, c, p };
          };
          const h = drawC(SH, R.CH, R.pH), f = drawC(SF, R.CF, R.pF);
          st = { sk, R, h, f, trade };
        });
        v.readout(() => {
          const { sk, R, h, f, trade } = st;
          const exp = (o) => { const dx = o.q[0] - o.c[0]; return dx > 0.003 ? `exports ${f2(dx, 3)} of $X$ and imports ${f2(-(o.q[1] - o.c[1]), 3)} of $Y$` : dx < -0.003 ? `imports ${f2(-dx, 3)} of $X$ and exports ${f2(o.q[1] - o.c[1], 3)} of $Y$` : 'does not trade'; };
          const capAb = sk > 0.5 ? 'Home' : sk < 0.5 ? 'Foreign' : null;
          return `Home holds ${f2(sk * 100, 0)}% of the world's capital and half its labour. Autarky prices of $X$ (in units of $Y$): Home ${f2(R.pH, 3)}, Foreign ${f2(R.pF, 3)}${capAb ? ` — the capital-abundant country, ${capAb}, has the **lower** price of the capital-intensive good` : ''}. Free-trade price ${f2(R.pw, 3)}.${trade ? ` Home ${exp(st.h)}; Foreign ${exp(st.f)}.` : ' Switch to free trade to see the trade flows.'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.16
    {
      num: '9.16', kind: 'Theorem', name: 'Stolper–Samuelson theorem',
      statement: String.raw`In a two-good, two-factor economy with constant returns, perfect competition and both goods produced, a rise in the relative price of a good raises the real return of the factor used intensively in that good and lowers the real return of the other factor. If $p_Y$ rises with $p_X$ fixed and $Y$ is labour-intensive, then the wage $w$ and the rental rate $r$ satisfy
$$\hat w > \hat p_Y > \hat p_X = 0 > \hat r,$$
where a hat denotes a proportional change. The wage rises by **more** than the price (the magnification effect), so $w/p_X$ and $w/p_Y$ both rise, while $r/p_X$ and $r/p_Y$ both fall.`,
      idea: String.raw`With free entry, each produced good has zero profit: price equals unit cost, $p_X = c_X(w, r)$ and $p_Y = c_Y(w, r)$. These two curves in the $(w, r)$ plane meet at the factor prices that support the goods prices. When $p_Y$ rises, the zero-profit curve of $Y$ shifts outward, while that of $X$ stays. Because $Y$ is labour-intensive its curve is steeper in $w$ than in $r$, so the new intersection has a higher $w$ and a lower $r$. The change in the weighted average of the factor-price changes equals the good's price change, $\hat p_Y = \theta_{LY}\hat w + \theta_{KY}\hat r$ with weights (cost shares) in $[0,1]$, so $\hat p_Y$ lies between $\hat w$ and $\hat r$, which gives the magnification: $\hat w > \hat p_Y > \hat r$. With Cobb–Douglas technologies the zero-profit conditions are log-linear and the computation is exact.`,
      caption: String.raw`**Slide the price of the labour-intensive good $Y$** (the capital-intensive good $X$ is the numeraire, $p_X = 1$). Left: the zero-profit curves in the $(w, r)$ plane; the dashed pair is the starting point $p_Y = 1$, the solid pair the new prices, and the arrow follows the intersection: the wage rises, the rental rate falls. Right: the proportional changes in percent: the wage change is the largest in magnitude (magnification) and the rental change has the opposite sign. Move the price below 1 to see the mirror image.`,
      deps: ['micro-9.15', 'micro-8.8'],
      refs: ['CORE Unit 18'], tags: ['trade', 'distribution'],
      credit: 'W. Stolper & P. Samuelson, 1941 (Review of Economic Studies 9: 58–73)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stolper%E2%80%93Samuelson_theorem' },
      viz(v) {
        const pS = v.slider('price of $Y$ (labour-intensive), $p_Y$', 0.5, 2, 1.3, { log: true, sig: 3 });
        const aS = v.slider('labour share in $X$: $\\alpha_X$', 0.15, 0.45, 0.3, { step: 0.01 });
        const bS = v.slider('labour share in $Y$: $\\alpha_Y$', 0.55, 0.85, 0.7, { step: 0.01 });
        const L = v.stage({ x: [0.3, 3], y: [0.3, 3], axes: 'box', gutter: true, height: 400, xlabel: 'wage w', ylabel: 'rental rate r', title: 'zero-profit curves: price = unit cost', weight: 1.15 });
        const B = v.stage({ x: [0.4, 4.6], y: [-60, 90], axes: 'box', gutter: true, height: 400, xlabel: '', ylabel: 'percent change', title: 'who gains, who loses', weight: 0.9, minWidth: 270, xticks: [[1, 'p_X'], [2, 'p_Y'], [3, 'w'], [4, 'r']] });
        v.legend([['teal', 'X: p_X = c_X(w, r)'], ['purple', 'Y: p_Y = c_Y(w, r)'], ['ink', 'factor prices (w, r)']]);
        const solveWR = (aa, bb, pX, pY) => { const d = aa - bb, lx = Math.log(pX), ly = Math.log(pY); return [Math.exp(((1 - bb) * lx - (1 - aa) * ly) / d), Math.exp((-bb * lx + aa * ly) / d)]; };
        let st = {};
        v.render(() => {
          const aa = aS.value, bb = bS.value, P = pS.value;
          const [w0, r0] = solveWR(aa, bb, 1, 1), [w1, r1] = solveWR(aa, bb, 1, P);
          const cx = (pX) => (w) => (pX / w ** aa) ** (1 / (1 - aa)), cy = (pY) => (w) => (pY / w ** bb) ** (1 / (1 - bb));
          L.fn(cx(1), { domain: [0.3, 3], color: 'teal', width: 2.6 });
          L.fn(cy(P), { domain: [0.3, 3], color: 'purple', width: 2.6 });
          L.fn(cy(1), { domain: [0.3, 3], color: 'purple', width: 1.6, dash: [6, 4], alpha: 0.6 });
          L.dot(w0, r0, { r: 5, color: 'muted', hollow: true }); L.dot(w1, r1, { r: 8, color: 'ink' });
          if (Math.hypot(L.X(w1) - L.X(w0), L.Y(r1) - L.Y(r0)) > 14) L.arrow(w0, r0, w1, r1, { color: 'ink', width: 2 });
          plateText(L, `(w, r) = (${f2(w1, 2)}, ${f2(r1, 2)})`, w1, r1, { dx: 12, dy: -14, align: 'left' });
          const pw = (w1 / w0 - 1) * 100, pr = (r1 / r0 - 1) * 100, ppy = (P - 1) * 100;
          B.hline(0, { color: 'muted', width: 1 });
          bar(B, 1, 0.6, 0, 0, 'teal'); bar(B, 2, 0.6, 0, ppy, 'purple'); bar(B, 3, 0.6, 0, pw, 'blue'); bar(B, 4, 0.6, 0, pr, 'red');
          st = { w0, r0, w1, r1, pw, pr, ppy, P };
        });
        v.readout(() => {
          const { w0, r0, w1, r1, pw, pr, ppy, P } = st;
          const ord = P > 1 ? pw > ppy && ppy > 0 && pr < 0 : P < 1 ? pw < ppy && ppy < 0 && pr > 0 : true;
          return `$\\hat p_X = 0$, $\\hat p_Y = ${f2(ppy, 1)}\\%$, $\\hat w = ${f2(pw, 1)}\\%$, $\\hat r = ${f2(pr, 1)}\\%$: ${P === 1 ? 'no price change' : ord ? `**the magnification order holds: $\\hat w$ is larger in size than $\\hat p_Y$, and $\\hat r$ has the opposite sign**` : 'order violated'}. Real wage: $w/p_X = ${f2(w1, 3)}$ (was ${f2(w0, 3)}), $w/p_Y = ${f2(w1 / P, 3)}$ (was ${f2(w0, 3)}); real rent: $r/p_X = ${f2(r1, 3)}$ (was ${f2(r0, 3)}), $r/p_Y = ${f2(r1 / P, 3)}$.`;
        });
      },
    },
  ],
};
