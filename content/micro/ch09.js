// Microeconomics — Chapter 9: General equilibrium and welfare (items 9.1–9.6; 9.7–9.11 in ch09-b.js, 9.12–9.16 in ch09-c.js, 9.17–9.21 in ch09-d.js)
import { clamp, GUIDE, fx, bisect, plateText, bar, W1, W2, W, pref, levelPts, toBox, market, contractCurve, improvements, improveTrail, boxStage, drawBox, drawA, drawB, drawLens, priceLineBox, slopeSeg, nearestOnPath, pathLength, f2 } from './ch09.shared.js';
import { walrasBudgetState, paddedRange } from './source-audit-exchange.js';

/** Trader preferences of the box items: Cobb–Douglas with weight `a` on good 1. */
const cd = (a) => pref('cd', { a });
const ua = (F) => (x, y) => F.u(x, y);
const ub = (F) => (x, y) => F.u(W1 - x, W2 - y);

export default {
  collection: 'micro',
  chapter: 9,
  title: 'General equilibrium and welfare',
  summary: String.raw`Markets are linked, and the Edgeworth box is the smallest picture of a whole economy: two traders, two goods, and prices that must clear both markets at once. Inside the box the chapter defines Pareto efficiency and the contract curve. It then proves that equilibria exist and are efficient (the first welfare theorem), shows that under convexity every efficient allocation can be reached by a market after lump-sum transfers (the second), and adds production, trade between countries with different factor endowments, the limits of aggregation, and fairness and social welfare comparisons.`,
  items: [
    // ------------------------------------------------------------------ 9.1
    {
      num: '9.1', kind: 'Model', name: 'Edgeworth box exchange economy',
      statement: String.raw`A **pure exchange economy** has two consumers, $A$ and $B$, and two goods, with fixed totals $\bar x_1 = W_1$ and $\bar x_2 = W_2$. An **allocation** gives $A$ the bundle $(x_1^A, x_2^A)$ and $B$ the bundle $(x_1^B, x_2^B)$; it is **feasible** when nothing is created or wasted,
$$x_1^A + x_1^B = W_1, \qquad x_2^A + x_2^B = W_2 .$$
Because $B$'s bundle is determined by $A$'s, the whole set of feasible allocations is the rectangle $[0, W_1] \times [0, W_2]$, the **Edgeworth box**: a point $(x_1, x_2)$ is $A$'s bundle measured from the lower-left corner $O_A$ and, read from the upper-right corner $O_B$, $B$'s bundle $(W_1 - x_1,\, W_2 - x_2)$. The traders start from an **endowment** $\omega = (\omega^A, \omega^B)$, a point of the box. If both have continuous, monotone preferences, the trades they will accept are the allocations that each weakly prefers to $\omega$: the **lens** between $A$'s indifference curve through $\omega$ (measured from $O_A$) and $B$'s (measured from $O_B$). The lens has a non-empty interior exactly when the two marginal rates of substitution differ at $\omega$.`,
      idea: String.raw`Feasibility is one equation per good, $x^A + x^B = \bar x$, so one point carries two bundles: the box is just the plane of $A$'s bundles with $B$'s axes drawn backwards from the opposite corner. An indifference curve of $B$ that is convex toward $O_B$ therefore looks concave when seen from $O_A$. At a point where the two curves through $\omega$ are tangent, they touch without enclosing anything, so no trade helps both; where their slopes (the marginal rates of substitution of 4.11) differ they cross, and the sliver between them is a set of trades that benefit both. Everything in the chapter, efficiency, the contract curve, the core and equilibrium, is a statement about this one picture.`,
      caption: String.raw`**Drag the gold endowment point $\omega$** anywhere in the box. Blue curve: $A$'s indifference curve through $\omega$, measured from $O_A$; orange curve: $B$'s, measured from $O_B$; the green lens holds every allocation both traders weakly prefer. Both traders have Cobb–Douglas tastes; the sliders move the weight each places on good 1. Put $\omega$ where the two tangent slopes agree and the lens closes to a line. The readout lists both bundles and the lens as a share of the box.`,
      deps: ['micro-4.4', 'micro-4.11'],
      see: ['micro-4.6'],
      refs: ['Varian Ch. 32', 'CORE Unit 5'], tags: ['general equilibrium', 'exchange'],
      credit: 'F. Y. Edgeworth, Mathematical Psychics, 1881 (the box form: Pareto 1906; Bowley 1924)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Edgeworth_box' },
      viz(v) {
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.6, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const s = boxStage(v, { title: 'the Edgeworth box', height: 420 });
        v.legend([['accent', 'A’s indifference curve through ω'], ['orange', 'B’s indifference curve through ω'], ['green', 'trades both prefer (the lens)', { area: true }], ['gold', 'endowment ω']]);
        const H = s.handle(3, 7, { color: 'gold', r: 9, label: 'ω', labelPos: 'ne', constrain: { x: [0.3, W1 - 0.3], y: [0.3, W2 - 0.3] } });
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = cd(bS.value), x = H.x, y = H.y;
          drawBox(s);
          drawLens(v, s, ua(FA), ub(FB), x, y, `lens1|${aS.value}|${bS.value}`);
          drawA(s, FA, FA.u(x, y)); drawB(s, FB, FB.u(W1 - x, W2 - y));
          s.dot(x, y, { r: 6, color: 'gold' });
          const mA = FA.mrs(x, y), mB = FB.mrs(W1 - x, W2 - y);
          const lens = improvements(ua(FA), ub(FB), x, y, 60).area;
          st = { x, y, uA: FA.u(x, y), uB: FB.u(W1 - x, W2 - y), mA, mB, lens };
        });
        v.readout(() => {
          const { x, y, uA, uB, mA, mB, lens } = st;
          return `$\\omega^A = (${f2(x)}, ${f2(y)})$ and $\\omega^B = (${f2(W1 - x)}, ${f2(W2 - y)})$: the two bundles always add up to the totals $(${W1}, ${W2})$.\nMarginal rates of substitution at $\\omega$: $MRS_A = ${f2(mA)}$, $MRS_B = ${f2(mB)}$. Utilities $u_A = ${f2(uA)}$, $u_B = ${f2(uB)}$. Lens of mutually preferred trades: **${f2(lens * 100, 1)}%** of the box${Math.abs(Math.log(mA / mB)) < 0.02 ? ' (the curves are tangent, so the lens has collapsed: no mutually beneficial trade)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.2
    {
      num: '9.2', kind: 'Definition', name: 'Pareto efficiency',
      statement: String.raw`A feasible allocation is **Pareto efficient** (or Pareto optimal) if there is no other feasible allocation that makes at least one consumer strictly better off without making anyone worse off. An allocation that some other feasible allocation **Pareto dominates** is **Pareto inefficient**; replacing it by the dominating one is a **Pareto improvement**. In the Edgeworth box with strictly monotone preferences, an interior allocation is efficient exactly when the two traders' indifference curves through it are tangent, $MRS_A = MRS_B$, so that the lens of mutually preferred allocations contains no point other than the allocation itself. Efficiency says nothing about fairness: handing one trader the whole box is efficient.`,
      idea: String.raw`If $MRS_A \ne MRS_B$ the indifference curves cross at the allocation, and the region between them is a set of allocations that both prefer: the trader with the higher MRS values good 1 more, so a swap of a little good 1 for a little good 2 at an intermediate rate helps both. Conversely, when the curves are tangent and convex preferences keep each upper contour set on its own side of the common tangent, the two better-off regions meet only at the allocation. The definition uses only the ordering of bundles, not a size of utility, so it needs none of the interpersonal comparisons that a ranking of efficient allocations would (9.13).`,
      caption: String.raw`**Drag the gold allocation.** Whenever the green lens has area, the arrow shows a Pareto improvement inside it (the trade that maximises the product of both gains); the short tangent segments show the two marginal rates of substitution. **Trade until efficient** repeats such improvements and leaves the trail. Switch on the contract curve to see where the lens disappears: only on the curve where $MRS_A = MRS_B$.`,
      deps: ['micro-9.1'],
      refs: ['Varian Ch. 1', 'Varian Ch. 32'], tags: ['welfare', 'efficiency'],
      credit: 'Vilfredo Pareto, Manuale di economia politica, 1906 (criterion; the term "Pareto optimum" is later)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pareto_efficiency' },
      viz(v) {
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.65, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const cc = v.toggle('show the contract curve', false);
        const s = boxStage(v, { title: 'Pareto improvements exist inside the lens', height: 420 });
        v.legend([['accent', 'A’s curve'], ['orange', 'B’s curve'], ['green', 'Pareto improvements (lens)', { area: true }], ['gold', 'allocation / improvement'], ['purple', 'contract curve', { dash: true }]]);
        const H = s.handle(2.6, 7.4, { color: 'gold', r: 9, label: 'x', labelPos: 'ne', constrain: { x: [0.3, W1 - 0.3], y: [0.3, W2 - 0.3] } });
        let trail = [];
        H.onDrag = () => { trail = []; };
        v.button('Trade until efficient', () => {
          const FA = cd(aS.value), FB = cd(bS.value);
          trail = improveTrail(ua(FA), ub(FB), H.x, H.y, 14);
          const e = trail[trail.length - 1]; H.set(e[0], e[1]);
        });
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = cd(bS.value), x = H.x, y = H.y;
          drawBox(s);
          drawLens(v, s, ua(FA), ub(FB), x, y, `lens2|${aS.value}|${bS.value}`);
          if (cc.value) s.path(contractCurve(FA, FB), { color: 'purple', width: 2.2, dash: [6, 4] });
          drawA(s, FA, FA.u(x, y)); drawB(s, FB, FB.u(W1 - x, W2 - y));
          const mA = FA.mrs(x, y), mB = FB.mrs(W1 - x, W2 - y);
          slopeSeg(s, x, y, mA, 52, { color: 'accent', width: 2.2, alpha: 0.9 });
          slopeSeg(s, x, y, mB, 38, { color: 'orange', width: 2.2, alpha: 0.9 });
          const imp = improvements(ua(FA), ub(FB), x, y, 60);
          for (let i = 0; i + 1 < trail.length; i++) { s.arrow(trail[i][0], trail[i][1], trail[i + 1][0], trail[i + 1][1], { color: 'gold', width: 1.6, alpha: 0.8 }); s.dot(trail[i][0], trail[i][1], { r: 3.5, color: 'gold' }); }
          if (!trail.length && imp.best) {
            const dx = imp.best[0] - x, dy = imp.best[1] - y, L = Math.hypot(s.X(x + dx) - s.X(x), s.Y(y + dy) - s.Y(y));
            if (L > 14) s.arrow(x, y, imp.best[0], imp.best[1], { color: 'gold', width: 2.4 });
            s.dot(imp.best[0], imp.best[1], { r: 5, color: 'gold', hollow: true });
          }
          const eff = imp.area < 0.001 || Math.abs(Math.log(mA / mB)) < 0.03;
          s.corner(eff ? 'Pareto efficient: no lens' : 'Pareto inefficient: a lens of improvements', 'tl', { color: eff ? 'green' : 'red', weight: 700, plate: true });
          st = { mA, mB, imp, eff, ua0: FA.u(x, y), ub0: FB.u(W1 - x, W2 - y), n: trail.length - 1, x, y, FA, FB };
        });
        v.readout(() => {
          const { mA, mB, imp, eff, ua0, ub0, n, x, y, FA, FB } = st;
          let t = `At the allocation: $MRS_A = ${f2(mA)}$, $MRS_B = ${f2(mB)}$ (ratio ${f2(mA / mB)}); $u_A = ${f2(ua0)}$, $u_B = ${f2(ub0)}$. The lens covers **${f2(imp.area * 100, 1)}%** of the box.`;
          if (n > 0) t += ` After ${n} improvement${n > 1 ? 's' : ''} both traders are better off: $u_A = ${f2(FA.u(x, y))}$, $u_B = ${f2(FB.u(W1 - x, W2 - y))}$.`;
          else if (imp.best) t += ` Improving move to $(${f2(imp.best[0])}, ${f2(imp.best[1])})$ gives $u_A = ${f2(FA.u(...imp.best))}$, $u_B = ${f2(FB.u(W1 - imp.best[0], W2 - imp.best[1]))}$.`;
          return t + (eff ? ' **No improvement exists.**' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 9.3
    {
      num: '9.3', kind: 'Definition', name: 'Contract curve',
      statement: String.raw`The **contract curve** (the **Pareto set**) of an exchange economy is the set of all Pareto-efficient allocations in the Edgeworth box. For smooth, strictly convex, strictly monotone preferences, an interior point of the box is on it exactly when the indifference curves of $A$ and $B$ are tangent,
$$MRS_A(x^A) = MRS_B(x^B), \qquad x^A + x^B = \bar x,$$
and the contract curve is a curve running from $O_A$ to $O_B$. With less well-behaved preferences it can be thick or lie on the boundary: for two perfect-complements consumers whose kinks are not aligned it is a **region** of the box, and for two perfect-substitutes consumers with different MRS it runs along the edges of the box.`,
      idea: String.raw`Efficiency is tangency (9.2), and tangency is one equation in the two unknowns $(x_1, x_2)$, so the solutions form a curve. Starting from $O_A$ the curve climbs because $A$, holding almost nothing, values everything at a very high marginal rate of substitution that must be matched by $B$'s, who holds almost everything. With corners the equation is replaced by a statement about which good each trader is short of: a trader at a kink is happy with any amount of surplus, so a whole wedge of allocations is efficient. With linear indifference curves slopes never change, so the only way to equalise them is to push one trader to a boundary.`,
      caption: String.raw`Pick the **family of tastes** and move the sliders (each trader's weight on good 1). The purple set is computed from the preferences: by solving $MRS_A = MRS_B$ for smooth tastes, from the kink rays for complements, from the corner solution for substitutes. **Drag the gold test allocation**: its lens vanishes only on the purple set, and the button snaps it to the nearest efficient allocation.`,
      deps: ['micro-9.2', 'micro-4.11'],
      refs: ['Varian Ch. 32'], tags: ['welfare', 'exchange'],
      credit: 'F. Y. Edgeworth, Mathematical Psychics, 1881 (the "contract curve")',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Contract_curve' },
      viz(v) {
        const fam = v.select('both traders have', [{ value: 'cd', label: 'Cobb–Douglas' }, { value: 'ces', label: 'CES (curvier)' }, { value: 'comp', label: 'perfect complements' }, { value: 'subs', label: 'perfect substitutes' }], 'cd');
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.6, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const s = boxStage(v, { title: 'the set of efficient allocations', height: 420 });
        v.legend([['purple', 'efficient allocations (contract curve / region)'], ['accent', 'A’s curve'], ['orange', 'B’s curve'], ['green', 'lens of improvements', { area: true }]]);
        const H = s.handle(2.5, 7, { color: 'gold', r: 9, label: 'x', labelPos: 'ne', constrain: { x: [0.3, W1 - 0.3], y: [0.3, W2 - 0.3] } });
        const mk = (k, t) => (k === 'cd' ? pref('cd', { a: t }) : k === 'ces' ? pref('ces', { a: t, r: -1.5 }) : k === 'comp' ? pref('comp', { a: 1 - t, b: t }) : pref('subs', { a: t, b: 1 - t }));
        /** efficient-set description for the current family */
        const setOf = () => {
          const k = fam.value, FA = mk(k, aS.value), FB = mk(k, bS.value);
          if (k === 'cd' || k === 'ces') return { k, FA, FB, curve: contractCurve(FA, FB) };
          if (k === 'subs') {
            const mA = aS.value / (1 - aS.value), mB = bS.value / (1 - bS.value);
            if (Math.abs(mA - mB) < 0.004) return { k, FA, FB, all: true };
            return { k, FA, FB, curve: mA > mB ? [[0, 0], [W1, 0], [W1, W2]] : [[0, 0], [0, W2], [W1, W2]] };
          }
          return { k, FA, FB, region: true };
        };
        // Leontief pair: improvement exists iff each is short of a different good
        const shortA = (E, x, y) => E.FA.a * x - E.FA.b * y;
        const shortB = (E, x, y) => E.FB.a * (W1 - x) - E.FB.b * (W2 - y);
        const effComp = (E, x, y) => !(shortA(E, x, y) < -1e-9 && shortB(E, x, y) > 1e-9) && !(shortA(E, x, y) > 1e-9 && shortB(E, x, y) < -1e-9);
        const isEff = (E, x, y) => {
          if (E.all) return true;
          if (E.region) return effComp(E, x, y);
          if (E.k === 'subs') return pathDist(E.curve, x, y) < 0.06;
          return Math.abs(Math.log(E.FA.mrs(x, y) / E.FB.mrs(W1 - x, W2 - y))) < 0.04;
        };
        const pathDist = (pts, x, y) => { const q = nearestOnPath(s, pts, x, y); return Math.hypot(q[0] - x, q[1] - y); };
        v.button('Snap to the efficient set', () => {
          const E = setOf(); let tgt = null;
          if (E.curve) tgt = nearestOnPath(s, E.curve, H.x, H.y);
          else if (E.region) {
            let bd = Infinity;
            for (let i = 1; i < 80; i++) for (let j = 1; j < 80; j++) { const px = (W1 * i) / 80, py = (W2 * j) / 80; if (effComp(E, px, py)) { const d = Math.hypot(px - H.x, py - H.y); if (d < bd) { bd = d; tgt = [px, py]; } } }
          }
          if (tgt) H.set(clamp(tgt[0], 0.3, W1 - 0.3), clamp(tgt[1], 0.3, W2 - 0.3));
        });
        let st = {};
        v.render(() => {
          const E = setOf(), { FA, FB } = E, x = H.x, y = H.y;
          drawBox(s);
          // the efficient set
          if (E.region) {
            const g = v.rgb('purple');
            s.raster((px, py) => (px >= 0 && px <= W1 && py >= 0 && py <= W2 && effComp(E, px, py) ? [g[0], g[1], g[2], 90] : null), { key: `eff3|${aS.value}|${bS.value}|${g}`, res: 3 });
            const kA = (FA.a / FA.b), kB = (FB.a / FB.b);
            s.clip(() => { s.line(0, 0, W1, kA * W1, { color: 'accent', width: 1.4, dash: [5, 4] }); s.line(W1, W2, W1 - W2 / kB, 0, { color: 'orange', width: 1.4, dash: [5, 4] }); }, [0, W1], [0, W2]);
          } else if (E.all) { s.rect(0, 0, W1, W2, { fill: 'purple', fillAlpha: 0.2, stroke: false }); }
          else s.path(E.curve, { color: 'purple', width: 4.2, alpha: 0.95 });
          drawLens(v, s, ua(FA), ub(FB), x, y, `lens3|${E.k}|${aS.value}|${bS.value}`, { alpha: 0.28 });
          drawA(s, FA, FA.u(x, y)); drawB(s, FB, FB.u(W1 - x, W2 - y));
          const eff = isEff(E, x, y), imp = improvements(ua(FA), ub(FB), x, y, 50);
          s.corner(eff ? 'efficient: on the set' : 'inefficient: a lens exists', 'tl', { color: eff ? 'green' : 'red', weight: 700, plate: true });
          st = { E, eff, imp, mA: FA.mrs(x, y), mB: FB.mrs(W1 - x, W2 - y) };
        });
        v.readout(() => {
          const { E, eff, imp, mA, mB } = st;
          const how = E.k === 'cd' || E.k === 'ces' ? `$MRS_A = ${f2(mA)}$, $MRS_B = ${f2(mB)}$: ${eff ? 'equal, so the point is on the curve' : 'unequal, so there is a trade both like'}.`
            : E.k === 'comp' ? `Each trader has a kink ray (dashed). An allocation is efficient unless one trader is short of good 1 while the other is short of good 2; the efficient region is the wedge between the two rays.`
              : E.all ? 'Both traders have the same MRS, so every allocation is efficient.' : `With constant MRS the only efficient allocations give the trader with the higher MRS all of the good he or she values most before the other gets any: the edges of the box.`;
          return `${how} Lens of improvements: **${f2(imp.area * 100, 1)}%** of the box.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.4
    {
      num: '9.4', kind: 'Definition', name: 'Core of an exchange economy',
      statement: String.raw`Given an endowment $\omega$, a coalition $S$ of consumers **blocks** an allocation $x$ if the members can reallocate their own endowments among themselves, $\sum_{i \in S} z^i = \sum_{i \in S} \omega^i$, so that everybody in $S$ weakly and someone strictly prefers $z^i$ to $x^i$. The **core** is the set of feasible allocations that no coalition blocks. In a two-trader economy the coalitions are $\{A\}$, $\{B\}$ and $\{A, B\}$, so the core is the part of the contract curve that both traders weakly prefer to the endowment:
$$\text{Core} = \{x \text{ Pareto efficient} : u_A(x^A) \ge u_A(\omega^A),\ u_B(x^B) \ge u_B(\omega^B)\}.$$
Every core allocation is Pareto efficient (the grand coalition cannot block) and individually rational (neither trader blocks alone).`,
      idea: String.raw`Blocking by a single consumer means refusing to trade: someone who can stay at the endowment will not accept a worse bundle, so the core lies in the lens of 9.1. Blocking by the grand coalition means finding a Pareto improvement, so the core lies on the contract curve of 9.3. The core is the overlap of the two sets, a segment of the curve, and it says how far a bargain can be pushed without relying on any price: it is a prediction about outcomes of free recontracting, Edgeworth's original idea, long before there was a theory of equilibrium prices. Where the endowment sits determines where the segment sits.`,
      caption: String.raw`**Drag the endowment $\omega$** (gold): the green stretch of the purple contract curve inside the lens is the core and it slides with $\omega$. **Drag the black test allocation** to see why an allocation is not in the core: below the lens one trader would rather stay at $\omega$ (blocked alone); off the contract curve, the pair itself can do better (blocked by both).`,
      deps: ['micro-9.3'],
      refs: ['Varian Ch. 32'], tags: ['exchange'],
      credit: 'F. Y. Edgeworth, 1881 (recontracting); the name "core": D. B. Gillies and L. S. Shapley',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Core_(game_theory)' },
      viz(v) {
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.65, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const s = boxStage(v, { title: 'the core: efficient allocations nobody blocks', height: 420 });
        v.legend([['purple', 'contract curve'], ['green', 'core (curve ∩ lens)'], ['green', 'lens of ω', { area: true }], ['ink', 'test allocation'], ['gold', 'endowment ω']]);
        const H = s.handle(3, 7, { color: 'gold', r: 9, label: 'ω', labelPos: 'ne', constrain: { x: [0.3, W1 - 0.3], y: [0.3, W2 - 0.3] } });
        const T = s.handle(6, 6, { color: 'ink', r: 8, label: 'x', labelPos: 'ne', constrain: { x: [0.2, W1 - 0.2], y: [0.2, W2 - 0.2] } });
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = cd(bS.value), x = H.x, y = H.y, a0 = FA.u(x, y), b0 = FB.u(W1 - x, W2 - y);
          drawBox(s);
          drawLens(v, s, ua(FA), ub(FB), x, y, `lens4|${aS.value}|${bS.value}`, { alpha: 0.2 });
          const cur = contractCurve(FA, FB, 160), core = [];
          let seg = [];
          for (const p of cur) { if (FA.u(p[0], p[1]) >= a0 - 1e-9 && FB.u(W1 - p[0], W2 - p[1]) >= b0 - 1e-9) seg.push(p); else if (seg.length) { core.push(seg); seg = []; } }
          if (seg.length) core.push(seg);
          s.path(cur, { color: 'purple', width: 2.2, alpha: 0.7 });
          for (const c of core) { s.path(c, { color: 'green', width: 6 }); }
          drawA(s, FA, a0, { width: 1.8, alpha: 0.8 }); drawB(s, FB, b0, { width: 1.8, alpha: 0.8 });
          s.dot(x, y, { r: 6, color: 'gold' });
          // test allocation
          const tx = T.x, ty = T.y, ta = FA.u(tx, ty), tb = FB.u(W1 - tx, W2 - ty);
          const blockA = ta < a0 - 1e-9, blockB = tb < b0 - 1e-9, eff = Math.abs(Math.log(FA.mrs(tx, ty) / FB.mrs(W1 - tx, W2 - ty))) < 0.04;
          const verdict = blockA && blockB ? 'blocked by A alone and by B alone' : blockA ? 'blocked by A alone: A prefers ω' : blockB ? 'blocked by B alone: B prefers ω' : !eff ? 'blocked by the pair: a Pareto improvement exists' : 'in the core';
          s.corner(verdict, 'tl', { color: verdict === 'in the core' ? 'green' : 'red', weight: 700, plate: true });
          const len = core.reduce((t, c) => t + pathLength(c), 0), tot = pathLength(cur);
          st = { verdict, len, tot, ncore: core.length, a0, b0, ta, tb };
        });
        v.readout(() => {
          const { verdict, len, tot, ncore, a0, b0, ta, tb } = st;
          return `Core length: **${f2((len / tot) * 100, 0)}%** of the contract curve${ncore ? '' : ' (empty: not possible with convex preferences)'}. Reservation utilities $u_A(\\omega) = ${f2(a0)}$, $u_B(\\omega) = ${f2(b0)}$; test allocation: $u_A = ${f2(ta)}$, $u_B = ${f2(tb)}$, **${verdict}**.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.5
    {
      num: '9.5', kind: 'Definition', name: 'Walrasian equilibrium',
      statement: String.raw`In an exchange economy with endowments $\omega^i$, a **Walrasian (competitive) equilibrium** is a price vector $p$ and an allocation $x^*$ such that (i) each consumer's bundle $x^{i*}$ is a best bundle in the budget set $\{x : p \cdot x \le p \cdot \omega^i\}$, and (ii) markets clear, $\sum_i x^{i*} = \sum_i \omega^i$. Equivalently, $p$ is an equilibrium price when the **excess demand** $z(p) = \sum_i \big(x^i(p, p\cdot\omega^i) - \omega^i\big)$ is zero. Demands are homogeneous of degree zero in $p$ (5.6), so only relative prices matter; in the box the budget lines of both traders are the **same** line through $\omega$ with slope $-p_1/p_2$.`,
      idea: String.raw`A price line through the endowment point is the budget line of both traders at once, since what $A$ can afford and what $B$ can afford are the two halves of the same line. Each picks the tangency of an indifference curve with that line, and the two choices are generally different points of the box: where $A$ wants more of good 1 than $B$ is willing to give up there is excess demand for good 1, and symmetrically. Rotating the line about $\omega$ moves both choices, and equilibrium is the slope at which they coincide. At that point both indifference curves are tangent to the line, so they are tangent to each other: the equilibrium allocation lies on the contract curve (anticipating 9.9).`,
      caption: String.raw`**Rotate the price line through $\omega$** (the slider is the relative price $p_1/p_2$). The blue dot is $A$'s best bundle and the orange dot is $B$'s, each on its tangent indifference curve; the readout gives the excess demand for each good. Turn on the **offer curves** (the best bundles over all prices) and note that equilibrium is where they cross. The button jumps to the market-clearing price; the dots coincide there.`,
      deps: ['micro-9.1', 'micro-5.6'],
      refs: ['Varian Ch. 32'], tags: ['general equilibrium'],
      credit: 'Léon Walras, 1874',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Competitive_equilibrium' },
      viz(v) {
        const pS = v.slider('relative price $p_1/p_2$', 0.2, 5, 0.6, { log: true, sig: 3 });
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.7, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const off = v.toggle('show offer curves', true);
        const s = boxStage(v, { title: 'one price line, two budget sets', height: 430 });
        v.legend([['ink', 'price line (both budget lines)'], ['accent', 'A’s best bundle'], ['orange', 'B’s best bundle'], ['green', 'market clears']]);
        const H = s.handle(7, 3, { color: 'gold', r: 9, label: 'ω', labelPos: 'ne', constrain: { x: [0.4, W1 - 0.4], y: [0.4, W2 - 0.4] } });
        v.button('Go to the equilibrium price', () => {
          const M = market(cd(aS.value), cd(bS.value), [H.x, H.y]), r = M.roots(0.2, 5);
          if (r.length) pS.set(r[0].p);
        });
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = cd(bS.value), M = market(FA, FB, [H.x, H.y]), p = pS.value;
          drawBox(s);
          if (off.value) {
            const pa = [], pb = [];
            for (let i = 0; i <= 120; i++) { const q = 0.2 * 25 ** (i / 120); const d = M.demA(q), e = M.boxB(q); pa.push(d[0] <= W1 && d[1] <= W2 ? d : null); pb.push(e[0] >= 0 && e[1] >= 0 && e[0] <= W1 && e[1] <= W2 ? e : null); }
            s.path(pa, { color: 'accent', width: 1.6, dash: [5, 4], alpha: 0.85 }); s.path(pb, { color: 'orange', width: 1.6, dash: [5, 4], alpha: 0.85 });
          }
          priceLineBox(s, H.x, H.y, p);
          const dA = M.demA(p), dB = M.boxB(p), clears = Math.hypot(dA[0] - dB[0], dA[1] - dB[1]) < 0.05;
          drawA(s, FA, FA.u(dA[0], dA[1]), { width: 1.9, alpha: 0.9 }); drawB(s, FB, FB.u(W1 - dB[0], W2 - dB[1]), { width: 1.9, alpha: 0.9 });
          s.dot(H.x, H.y, { r: 6, color: 'gold' });
          s.dot(dA[0], dA[1], { r: 7, color: clears ? 'green' : 'accent' }); s.dot(dB[0], dB[1], { r: 5.5, color: clears ? 'green' : 'orange', hollow: !clears });
          if (clears) plateText(s, 'market clears', dA[0], dA[1], { dy: -16, color: 'green', align: 'center' });
          else s.line(dA[0], dA[1], dB[0], dB[1], { color: 'red', width: 2.2, dash: [4, 3] });
          const z = M.z(p), r = M.roots(0.2, 5);
          st = { p, z, pstar: r.length ? r[0].p : null, dA, dB, clears };
        });
        v.readout(() => {
          const { p, z, pstar, dA, dB, clears } = st;
          return `At $p_1/p_2 = ${f2(p)}$: $A$ demands $(${f2(dA[0])}, ${f2(dA[1])})$, $B$ demands $(${f2(W1 - dB[0])}, ${f2(W2 - dB[1])})$. Excess demand $z_1 = ${f2(z[0])}$, $z_2 = ${f2(z[1])}$${clears ? ' (both zero: **equilibrium**)' : z[0] > 0 ? ': good 1 is in excess demand, so its price should rise' : ': good 1 is in excess supply, so its price should fall'}.${pstar ? ` Equilibrium price: $p^* = ${f2(pstar, 3)}$.` : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.6
    {
      num: '9.6', kind: 'Proposition', name: 'Walras’ law',
      statement: String.raw`In a finite pure exchange economy, let prices be strictly positive, $p\gg0$, and let consumer $i$ choose a budget-feasible bundle $x^i$ from income $p\cdot\omega^i$. If every consumer exhausts that budget, then the value of aggregate excess demand $z=\sum_i(x^i-\omega^i)$ is zero at every such price, including prices away from equilibrium:
$$p\cdot z=\sum_k p_kz_k=0.$$
Local non-satiation ensures budget exhaustion for a maximizing bundle. Consequently, if all but one market clear, the last market clears too. The positive price of the last good matters: at a zero price its excess supply can have zero value without vanishing. With good 2 as numéraire, $p_2=1$ and $p=p_1/p_2>0$, the identity is $p z_1+z_2=0$. More generally, if consumers leave a total amount $U$ of income unspent, budget accounting gives $p\cdot z=-U\le0$.`,
      idea: String.raw`Add the individual budget identities: the value of a sum of net purchases is the sum of their values. Local non-satiation rules out a maximizing bundle strictly inside the budget, since a sufficiently small improvement would still be affordable. To infer that a remaining excess demand is zero, divide its zero value by its positive price. When a bliss point makes a consumer stop spending, the same accounting calculation still holds, but its right side is minus the unspent income.`,
      caption: String.raw`The complete curves show both excess demands over $0.1\le p\le10$; their vertical scales include the endpoints. The bars show the two value terms at the selected price. **Clear market 1** selects its exact clearing price. With ordinary Cobb–Douglas tastes the two bars cancel and both markets clear together. Toggle $A$'s **bliss point**: once it is affordable, $A$ leaves income unspent and the sum is its negative. **Bliss affordability boundary** selects $p=2/3$; move one price step either way to cross it. Clearing market 1 then leaves excess supply in market 2. This breaks the budget-exhaustion hypothesis.`,
      scope: String.raw`A two-good, two-consumer model with totals $(10,10)$, endowments $\omega^A=(7,2)$ and $\omega^B=(3,8)$, and strictly positive prices $(p,1)$. Ordinary utilities are $x^{0.35}y^{0.65}$ for $A$ and $x^{0.6}y^{0.4}$ for $B$. The toggle replaces $A$'s utility by $-[(x-4)^2+(y-4)^2]$, whose unconstrained optimum is $(4,4)$. Quantities and prices are illustrative.`,
      deps: ['micro-9.5'],
      refs: ['Arrow & Debreu (1954), §§1.3–1.5, especially budget exhaustion §1.4.2 and free goods §1.4.1', 'https://web.stanford.edu/class/msande311/arrow-debreu.pdf', 'Condie, Advanced Microeconomic Theory, §7.2, Proposition 7.1'], tags: ['general equilibrium'],
      credit: 'Budget-identity formulation; Arrow & Debreu, 1954, §1.4.2',
      verify: false,
      links: { source: 'https://web.stanford.edu/class/msande311/arrow-debreu.pdf' },
      viz(v) {
        const pS = v.slider('relative price $p_1/p_2$', .1, 10, 1.4, { log: true, sig: 3 });
        const sat = v.toggle('$A$ is satiated (bliss point at (4, 4))', false);
        const L = v.stage({ x: [.08, 12.5], y: [-10, 60], xlog: true, axes: 'box', gutter: true, height: 370, xlabel: 'relative price p₁/p₂', ylabel: 'excess demand', title: 'complete excess-demand curves', weight: 1.2 });
        const R = v.stage({ x: [.3, 3.7], y: [-10, 10], axes: 'box', gutter: true, height: 370, ylabel: 'value of excess demand', title: 'value terms at the chosen price', xticks: [[1, 'p·z₁'], [2, 'z₂'], [3, 'sum']] });
        v.legend([['blue', 'z₁(p)'], ['orange', 'z₂(p)'], ['green', 'p·z₁ + z₂', { dash: true }], ['gold', 'chosen price']]);
        v.button('clear market 1', () => pS.set(walrasBudgetState(pS.value, sat.value).market1Price));
        v.button('bliss affordability boundary', () => pS.set(2 / 3));
        let info = {};
        v.render(() => {
          const p = walrasBudgetState(pS.value, sat.value), f = q => walrasBudgetState(q, sat.value);
          const values = [0];
          for (let i = 0; i <= 240; i++) { const q = .1 * 100 ** (i / 240), a = f(q); values.push(...a.z, a.value); }
          L.setView([.08, 12.5], paddedRange(values, .13));
          R.setView([.3, 3.7], paddedRange([0, ...p.valueTerms, p.value], .22));
          L.hline(0, { color: 'muted', width: 1 });
          L.fn(q => f(q).z[0], { domain: [.1, 10], color: 'blue', width: 2.6, n: 300 });
          L.fn(q => f(q).z[1], { domain: [.1, 10], color: 'orange', width: 2.6, n: 300 });
          L.fn(q => f(q).value, { domain: [.1, 10], color: 'green', width: 2.4, n: 300, dash: [6, 4] });
          L.vline(p.p, { color: 'gold', width: 1.5 });
          L.dot(p.p, p.z[0], { r: 5, color: 'blue' }); L.dot(p.p, p.z[1], { r: 5, color: 'orange' });
          R.hline(0, { color: 'muted', width: 1 });
          bar(R, 1, .55, 0, p.valueTerms[0], 'blue'); bar(R, 2, .55, 0, p.valueTerms[1], 'orange');
          bar(R, 3, .55, 0, p.value, p.unspentA > 0 ? 'red' : 'green', { fillAlpha: .8 });
          info = p;
        });
        v.readout(() => `At $p=${f2(info.p, 5)}$: $z_1=${f2(info.z[0], 6)}$, $z_2=${f2(info.z[1], 6)}$. Value terms: $p z_1=${f2(info.valueTerms[0], 6)}$, $z_2=${f2(info.valueTerms[1], 6)}$, sum $=${f2(info.value, 6)}$.\nIncome / expenditure: $A$ ${f2(info.incomeA, 6)} / ${f2(info.spendingA, 6)}, $B$ ${f2(info.incomeB, 6)} / ${f2(info.spendingB, 6)}. Unspent income $U=${f2(info.unspentA + info.unspentB, 6)}$, so the sum equals $-U$. ${info.unspentA > 0 ? 'Budget exhaustion fails: the bliss bundle is affordable.' : 'Both budgets are exhausted: Walras’ law holds.'}\nExact market-1 clearing price: $${info.satiated ? '8/7' : '22/23'}$. There $z_2=${f2(walrasBudgetState(info.market1Price, info.satiated).z[1], 6)}$: ${info.satiated ? 'market 2 has excess supply.' : 'both markets clear.'}`);
      },
    },
  ],
};
