// Microeconomics — Chapter 9: General equilibrium and welfare (items 9.7–9.11; 9.1–9.6 in ch09.js)
import { clamp, GUIDE, bisect, plateText, bar, W1, W2, pref, toBox, market, contractCurve, paretoSearch, improvements, boxStage, drawBox, drawA, drawB, drawLens, priceLineBox, slopeSeg, nearestOnPath, pathLength, f2 } from './ch09.shared.js';

const cd = (a) => pref('cd', { a });
const ua = (F) => (x, y) => F.u(x, y);
const ub = (F) => (x, y) => F.u(W1 - x, W2 - y);
/** Offer curve of A and of B (box points) over the price grid; null breaks the path where a demand is off the box or jumps. */
function offers(M, p0 = 0.2, p1 = 5, n = 160) {
  const pa = [], pb = []; let prevB = null;
  for (let i = 0; i <= n; i++) {
    const q = p0 * (p1 / p0) ** (i / n), d = M.demA(q), e = M.boxB(q);
    pa.push(d[0] <= W1 + 1e-6 && d[1] <= W2 + 1e-6 ? d : null);
    const okB = e[0] >= -1e-6 && e[1] >= -1e-6 && e[0] <= W1 + 1e-6 && e[1] <= W2 + 1e-6;
    pb.push(okB && !(prevB && Math.hypot(e[0] - prevB[0], e[1] - prevB[1]) > 2.2) ? e : null);
    prevB = e;
  }
  return [pa, pb];
}

export default {
  collection: 'micro',
  chapter: 9,
  items: [
    // ------------------------------------------------------------------ 9.7
    {
      num: '9.7', kind: 'Theorem', name: 'Existence of exchange equilibrium',
      statement: String.raw`Consider an exchange economy in which every consumer has continuous, strictly convex and strongly monotone preferences and the total endowment of each good is positive. Then aggregate excess demand $z(p)$ is a continuous function on strictly positive prices, homogeneous of degree zero, satisfying Walras' law (9.6), and it explodes when a price tends to zero. Under these conditions there is a price vector $p^* \gg 0$ with
$$z(p^*) = 0,$$
a Walrasian equilibrium (9.5). With two goods this is the statement that the single continuous function $z_1(p_1/p_2)$, positive for small relative prices and negative for large ones, has a zero.`,
      idea: String.raw`With two goods, Walras' law makes market 2 redundant and homogeneity reduces everything to the relative price $p = p_1/p_2$. As $p \to 0$ good 1 is almost free and everybody wants more, so $z_1 > 0$; as $p \to \infty$ the traders can afford little of it and sell what they have, so $z_1 < 0$; and $z_1$ is continuous because strictly convex preferences give each consumer a unique, continuously varying best bundle. The intermediate value theorem (Rudin 4.23) then yields a zero. With $n$ goods the same argument runs through Brouwer's fixed-point theorem applied to a price-adjustment map of the simplex (9.21). Convexity is not a technicality: when it fails, demand jumps and $z_1$ can leap over zero.`,
      caption: String.raw`Left: $z_1(p)$ for $A$ (Cobb–Douglas) and a second trader $B$ whose preferences you choose. With **convex** preferences the curve runs continuously from $+$ to $-$ and crosses zero at $p^*$ (green). Switch to **non-convex** tastes for $B$ (indifference curves bulging away from the origin): $B$'s demand flips between two corners at $p = 1$, the curve jumps (dashed) over zero and no price clears the market. Right: the offer curves in the box; equilibrium is where they cross (in the non-convex case $B$'s corner demands lie outside the box, so only $A$'s curve is visible). Drag $\omega$ or the price.`,
      deps: ['micro-9.6', 'pma-4.23', 'top-13.11'],
      see: ['micro-9.21', 'micro-2.5'],
      refs: ['Varian Ch. 32'], tags: ['general equilibrium', 'existence'],
      credit: 'Wald (1936), Arrow & Debreu, 1954 and McKenzie, 1954 (general proofs)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Arrow%E2%80%93Debreu_model' },
      viz(v) {
        const kind = v.select('$B$’s preferences', [{ value: 'cd', label: 'convex (Cobb–Douglas)' }, { value: 'sq', label: 'non-convex' }], 'cd');
        const pS = v.slider('relative price $p_1/p_2$', 0.2, 5, 0.7, { log: true, sig: 3 });
        const L = v.stage({ x: [0.2, 5], y: [-8, 10], xlog: true, axes: 'box', gutter: true, height: 380, xlabel: 'relative price p₁/p₂', ylabel: 'excess demand z₁', title: 'excess demand for good 1', weight: 1.15 });
        const R = boxStage(v, { title: 'offer curves in the box', height: 380, weight: 1 });
        v.legend([['blue', 'z₁(p)'], ['green', 'equilibrium'], ['gold', 'chosen price'], ['accent', 'A’s offer curve', { dash: true }], ['orange', 'B’s offer curve', { dash: true }]]);
        const H = R.handle(7, 3, { color: 'gold', r: 8, label: 'ω', labelPos: 'ne', constrain: { x: [0.4, W1 - 0.4], y: [0.4, W2 - 0.4] } });
        let st = {};
        v.render(() => {
          const FA = cd(0.5), FB = kind.value === 'cd' ? cd(0.4) : pref('sq'), M = market(FA, FB, [H.x, H.y]), p = pS.value;
          const cl = (q) => clamp(M.z1(q), -30, 30);
          L.hline(0, { color: 'muted', width: 1 });
          const sq = kind.value === 'sq';
          if (sq) {
            L.fn(cl, { domain: [0.2, 0.9995], color: 'blue', width: 2.8, n: 120 }); L.fn(cl, { domain: [1.0005, 5], color: 'blue', width: 2.8, n: 120 });
            const a = M.z1(0.9999), b = M.z1(1.0001);
            L.line(1, a, 1, b, { color: 'red', width: 2, dash: [4, 3] }); L.dot(1, a, { r: 4.5, color: 'blue' }); L.dot(1, b, { r: 4.5, color: 'blue', hollow: true });
          } else L.fn(cl, { domain: [0.2, 5], color: 'blue', width: 2.8, n: 200 });
          const roots = M.roots(0.2, 5);
          for (const r of roots) { L.dot(r.p, 0, { r: 6.5, color: 'green' }); plateText(L, `p* = ${f2(r.p, 2)}`, r.p, 0, { dy: 20, dx: 6, color: 'green', align: 'left' }); }
          L.vline(p, { color: 'gold', width: 2 }); L.dot(p, cl(p), { r: 5, color: 'gold' });
          if (!roots.length) plateText(L, 'z₁ jumps over zero: no price clears market 1', 1.0, 6.5, { color: 'red', align: 'center' });
          drawBox(R);
          const [pa, pb] = offers(M);
          R.path(pa, { color: 'accent', width: 2.2, dash: [5, 4] }); R.path(pb, { color: 'orange', width: 2.2, dash: [5, 4] });
          for (const r of roots) R.dot(...M.demA(r.p), { r: 7, color: 'green' });
          priceLineBox(R, H.x, H.y, p, { width: 1.4, alpha: 0.7 });
          const dA = M.demA(p), dB = M.boxB(p);
          R.dot(H.x, H.y, { r: 6, color: 'gold' }); R.dot(dA[0], dA[1], { r: 5.5, color: 'accent' }); R.dot(dB[0], dB[1], { r: 5.5, color: 'orange' });
          st = { roots, zl: M.z1(0.2), zr: M.z1(5), jump: sq ? M.z1(0.9999) - M.z1(1.0001) : 0, sq, p, z: M.z1(p) };
        });
        v.readout(() => {
          const { roots, zl, zr, jump, sq, z, p } = st;
          return `$z_1(0.2) = ${f2(zl)} > 0$ and $z_1(5) = ${f2(zr)} < 0$ at the ends of the window. ${roots.length ? `The curve is continuous and has **${roots.length} zero${roots.length > 1 ? 's' : ''}**: $p^* = ${roots.map((r) => f2(r.p, 3)).join(', ')}$.` : `Continuity fails: at $p = 1$ the demand of $B$ jumps and $z_1$ falls by ${f2(jump)} from a positive to a negative value, so **no price clears the market** although $z_1 > 0$ on the left and $< 0$ on the right.`} At the chosen price $z_1(${f2(p)}) = ${f2(z)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.8
    {
      num: '9.8', kind: 'Phenomenon', name: 'Multiple and unstable equilibria',
      statement: String.raw`Existence (9.7) does not give uniqueness or stability. When income effects are strong (a trader who owns a good that is a strong complement of what he or she wants buys less of the other good when its price falls), the excess demand $z_1(p)$ can cross zero **three times**, so the economy has several equilibria. Under the price-adjustment rule $\dot p_1/p_1 = c\, z_1(p)$ (raise the price of a good in excess demand, lower it otherwise), an equilibrium is **locally stable** when $z_1$ crosses zero downward (the slope $z_1'(p^*)$ is negative) and **unstable** when it crosses upward. In the examples below the two outer equilibria are stable and the middle one is unstable. With gross substitutes, in contrast, equilibrium is unique and tâtonnement converges (Arrow–Block–Hurwicz).`,
      idea: String.raw`In a two-good economy a stable equilibrium is a down-crossing of $z_1$ and an unstable one an up-crossing, and between two down-crossings of a continuous function there must be an up-crossing, so the number of equilibria is odd and stable and unstable ones alternate (9.7 supplies the first). To obtain three crossings, $z_1$ has to be non-monotone, and that needs the income effect to beat the substitution effect: here both traders have nearly Leontief tastes, the first owning only good 1 and the second only good 2. The offer curves then bend back and cross the line of the endowment more than once. The picture is the one behind Scarf's examples of global instability (1960) and Shapley and Shubik's (1977) example of three equilibria.`,
      caption: String.raw`Left: excess demand $z_1(p)$ (in thousandths of a unit; trader $A$ owns only good 1, $B$ only good 2). The coloured dots are price-adjustment runs that **start at six different prices** (or click the panel to start one there) and follow $\dot p/p = c\,z_1(p)$: they settle at the two outer equilibria (green) and flee the middle one (red). Arrows on the axis show the direction of adjustment. Right: the box with the two offer curves, which cross at the same three points but are nearly indistinguishable at this scale. Weaken the complementarity (slide $\rho$ up) and the extra equilibria merge and vanish.`,
      deps: ['micro-9.7', 'micro-2.7'],
      see: ['micro-9.5'],
      refs: ['Varian Ch. 32'], tags: ['general equilibrium', 'stability'],
      credit: 'H. Scarf, 1960 (global instability); L. Shapley & M. Shubik, 1977 (three equilibria)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/General_equilibrium_theory' },
      viz(v) {
        const rS = v.slider('complementarity $\\rho$ (more negative = closer to Leontief)', -30, -12, -20, { step: 0.5 });
        const Z = v.stage({ x: [0.2, 5], y: [-10, 10], xlog: true, axes: 'box', gutter: true, height: 400, xlabel: 'relative price p₁/p₂  (click to start a run)', ylabel: 'excess demand z₁  (units of 0.001)', title: 'price adjustment on the excess demand curve', weight: 1.35 });
        const R = boxStage(v, { title: 'the box: the offer curves hug each other', height: 400, weight: 0.9, minWidth: 250 });
        v.legend([['accent', 'A’s offer curve', { dash: true }], ['orange', 'B’s offer curve', { dash: true }], ['green', 'stable equilibrium', { dot: true }], ['red', 'unstable equilibrium', { dot: true }], ['ink', 'excess demand z₁']]);
        const starts = [0.22, 0.42, 0.97, 1.03, 1.7, 4], cols = ['purple', 'teal', 'pink', 'gold', 'blue', 'orange'];
        let extra = null;
        Z.onClick((x) => { extra = clamp(x, 0.21, 4.9); v.restart(); });
        const econ = () => market(pref('ces', { a: 0.9, r: rS.value }), pref('ces', { a: 0.1, r: rS.value }), [W1, 0]);
        const K = 1000, C = 0.1, DT = 0.05, NS = 800; let cache = { key: '', tr: [] };
        const trajectories = (M) => {
          const key = `${rS.value}|${extra}`; if (cache.key === key) return cache.tr;
          const f = (lp) => C * K * M.z1(Math.exp(lp)), tr = [];
          for (const p0 of extra ? [...starts, extra] : starts) {
            let lp = Math.log(p0); const a = [p0];
            for (let k = 0; k < NS; k++) { const k1 = f(lp), k2 = f(lp + (DT / 2) * k1), k3 = f(lp + (DT / 2) * k2), k4 = f(lp + DT * k3); lp = clamp(lp + (DT / 6) * (k1 + 2 * k2 + 2 * k3 + k4), Math.log(0.2), Math.log(5)); a.push(Math.exp(lp)); }
            tr.push(a);
          }
          cache = { key, tr }; return tr;
        };
        let st = {};
        v.animate((t) => {
          const M = econ(), roots = M.roots(0.2, 5, 500), tr = trajectories(M), tau = Math.min(NS, Math.round((t * 3.4) / DT));
          drawBox(R);
          const [pa, pb] = offers(M, 0.2, 5, 240);
          R.path(pa, { color: 'accent', width: 3, dash: [5, 4] }); R.path(pb, { color: 'orange', width: 3, dash: [5, 4], alpha: 0.9 });
          Z.hline(0, { color: 'muted', width: 1 });
          Z.fn((q) => clamp(K * M.z1(q), -14, 14), { domain: [0.2, 5], color: 'ink', width: 2.6, n: 400 });
          // flow arrows along the axis: price rises where z₁ > 0
          for (let i = 0; i < 14; i++) { const q = 0.2 * 25 ** ((i + 0.5) / 14), z = M.z1(q); Z.text(z > 0 ? '▶' : '◀', q, -8.6, { size: 11, color: z > 0 ? 'green' : 'red', align: 'center', alpha: 0.8 }); }
          for (const r of roots) {
            const col = r.stable ? 'green' : 'red';
            Z.dot(r.p, 0, { r: 7, color: col, hollow: !r.stable }); R.dot(...M.demA(r.p), { r: 7, color: col, hollow: !r.stable });
            plateText(Z, r.stable ? 'stable' : 'unstable', r.p, 0, { dy: -17, color: col, align: 'center' });
          }
          tr.forEach((a, i) => {
            const col = cols[i % cols.length];
            for (let k = 8; k >= 0; k--) { const j = Math.max(0, tau - k * 6), q = a[j]; Z.dot(q, clamp(K * M.z1(q), -14, 14), { r: k === 0 ? 5.5 : 2.2, color: col, alpha: k === 0 ? 1 : 0.35 }); }
          });
          st = { roots, ends: tr.map((a) => a[Math.min(NS, tau)]), tau };
        }, { period: 14, still: 13 });
        v.readout(() => {
          const { roots, ends } = st;
          const list = roots.map((r) => `$p = ${f2(r.p, 3)}$ (${r.stable ? 'stable' : 'unstable'}, $z_1' = ${f2(r.slope * 1000, 1)}\\times10^{-3}$)`).join('; ');
          return `**${roots.length} equilibri${roots.length === 1 ? 'um' : 'a'}**: ${list || 'none found'}. Each trader has $\\sigma = 1/(1-\\rho) = ${f2(1 / (1 - rS.value), 3)}$. Run end-points now: ${ends.map((p) => f2(p, 2)).join(', ')}. The excess demands are a few thousandths of a unit: with nearly Leontief tastes the two offer curves almost coincide, which is why the effect needs the zoom of the left panel.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.9
    {
      num: '9.9', kind: 'Theorem', name: 'First fundamental theorem of welfare economics',
      statement: String.raw`If every consumer's preferences are locally non-satiated and depend only on his or her own consumption bundle, then every Walrasian equilibrium allocation is Pareto efficient. No convexity, differentiability or existence assumption is needed: the theorem says only that **if** a competitive equilibrium exists, it is efficient. In the box, the equilibrium point lies on the contract curve, with both indifference curves tangent to the common price line. If the hypothesis that utility depends only on one's own bundle fails (a consumption externality), the equilibrium can be inefficient.`,
      idea: String.raw`Suppose some feasible allocation $y$ made everyone at least as well off and someone strictly better off. Strictly better means unaffordable at equilibrium, so $p\cdot y^i > p\cdot\omega^i$ for that consumer; weakly better means no cheaper, $p\cdot y^i \ge p\cdot\omega^i$, by local non-satiation. Adding up, $p \cdot \sum y^i > p \cdot \sum \omega^i$, which contradicts feasibility $\sum y^i \le \sum \omega^i$ at non-negative prices. The argument uses only budget constraints and the fact that each consumer chooses by his or her own utility at common prices, which is exactly what an externality breaks: when $B$ is bothered by $A$'s consumption, $B$'s choice does not reflect the harm it suffers.`,
      caption: String.raw`**Drag the endowment $\omega$**: the market equilibrium $E$ (green) is computed by clearing the markets, and the readout shows $MRS_A = MRS_B$ at $E$, with the contract curve passing through it and no lens left. Then raise **$\gamma$**: $B$ is bothered by $A$'s consumption of good 1 (true utility $u_B - \gamma x_1^A$, red curve through $E$). The market still picks the same $E$, since each trader ignores the effect, but now the lens of improvements reopens (arrow: a trade making both better off).`,
      deps: ['micro-9.5', 'micro-9.2'],
      see: ['micro-9.10'],
      refs: ['Varian Ch. 32'], tags: ['welfare', 'efficiency'],
      credit: 'K. Arrow, 1951; G. Debreu, 1951 (modern proofs)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fundamental_theorems_of_welfare_economics' },
      viz(v) {
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.65, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const gS = v.slider('externality $\\gamma$: harm to $B$ per unit of $A$’s good 1', 0, 1.5, 0, { step: 0.01 });
        const s = boxStage(v, { title: 'the market equilibrium and the efficient set', height: 430 });
        v.legend([['green', 'market equilibrium E'], ['purple', 'contract curve', { dash: true }], ['accent', 'A’s curve'], ['orange', 'B’s curve'], ['red', 'B’s true curve (with γ)', { dash: true }], ['green', 'improvement lens', { area: true }]]);
        const H = s.handle(7, 3, { color: 'gold', r: 9, label: 'ω', labelPos: 'se', constrain: { x: [0.4, W1 - 0.4], y: [0.4, W2 - 0.4] } });
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = cd(bS.value), g = gS.value, M = market(FA, FB, [H.x, H.y]), roots = M.roots(0.05, 20);
          drawBox(s);
          const trueB = (x, y) => FB.u(W1 - x, W2 - y) - g * x;
          if (!roots.length) { st = { none: true }; return; }
          const p = roots[0].p, E = M.demA(p);
          if (g === 0) s.path(contractCurve(FA, FB), { color: 'purple', width: 2.4, dash: [6, 4] });
          drawLens(v, s, ua(FA), trueB, E[0], E[1], `lens9|${aS.value}|${bS.value}|${g}`, { alpha: 0.32 });
          priceLineBox(s, H.x, H.y, p, { width: 1.6 });
          drawA(s, FA, FA.u(...E)); drawB(s, FB, FB.u(W1 - E[0], W2 - E[1]));
          if (g > 0) s.clip(() => s.contour(trueB, trueB(E[0], E[1]), { color: 'red', width: 2.2, res: 120 }), [0, W1], [0, W2]);
          s.dot(H.x, H.y, { r: 6, color: 'gold' }); s.dot(E[0], E[1], { r: 8, color: 'green' });
          plateText(s, 'E', E[0], E[1], { dx: -13, dy: -13, color: 'green' });
          const imp = improvements(ua(FA), trueB, E[0], E[1], 60);
          if (imp.best) { s.arrow(E[0], E[1], imp.best[0], imp.best[1], { color: 'red', width: 2.2 }); s.dot(imp.best[0], imp.best[1], { r: 5, color: 'red', hollow: true }); }
          st = { p, E, mA: FA.mrs(...E), mB: FB.mrs(W1 - E[0], W2 - E[1]), imp, g, ua0: FA.u(...E), ub0: trueB(...E), best: imp.best && [FA.u(...imp.best), trueB(...imp.best)] };
        });
        v.readout(() => {
          if (st.none) return 'No equilibrium found at this endowment.';
          const { p, E, mA, mB, imp, g, ua0, ub0, best } = st;
          let t = `Equilibrium: $p^* = ${f2(p, 3)}$, $A$ gets $(${f2(E[0])}, ${f2(E[1])})$, $B$ gets $(${f2(W1 - E[0])}, ${f2(W2 - E[1])})$; $MRS_A = ${f2(mA, 3)}$, $MRS_B = ${f2(mB, 3)}$ (equal: both equal the price ratio).`;
          if (g === 0) t += ` Lens of improvements at $E$: **${f2(imp.area * 100, 1)}%**. The equilibrium is Pareto efficient.`;
          else t += ` With the externality the market allocation is **inefficient**: the lens covers ${f2(imp.area * 100, 1)}% of the box; moving to the arrow's tip changes $(u_A, u_B^{\\text{true}})$ from $(${f2(ua0)}, ${f2(ub0)})$ to $(${f2(best[0])}, ${f2(best[1])})$.`;
          return t;
        });
      },
    },
    // ------------------------------------------------------------------ 9.10
    {
      num: '9.10', kind: 'Theorem', name: 'Second fundamental theorem of welfare economics',
      statement: String.raw`Suppose preferences are continuous, convex and locally non-satiated, and let $x^*$ be a Pareto-efficient allocation in which every consumer holds a positive amount of every good. Then there is a price vector $p \gg 0$ such that $x^*$ is a Walrasian equilibrium allocation **once the endowments are redistributed** by lump-sum transfers so that each consumer can just afford his or her bundle, $p\cdot\omega'^i = p\cdot x^{i*}$. Efficient allocations can therefore be reached through the market, with prices doing the allocating and a transfer of wealth doing the distributing. Without convexity the theorem fails: an efficient allocation need not be supported by any price.`,
      idea: String.raw`Collect the bundles that every consumer likes better than $x^{i*}$ and add them up: the result is a convex set, because each upper contour set is convex (4.6), and it does not contain the total endowment, because $x^*$ is efficient. The separating hyperplane theorem (Hahn–Banach, fa-3.4) puts a hyperplane with normal $p$ between the two; this $p$ is the price. In the box it is the common tangent of the two indifference curves through $x^*$. After the transfer each consumer's budget line passes through $x^{i*}$, and convexity makes the tangency a global maximum on it. If $B$'s indifference curve bulges away from $O_B$, the same line touches it only where it is locally the worst bundle on the line, and $B$ prefers a corner.`,
      caption: String.raw`**Drag the black target $x^*$** along the set of efficient allocations; the black price line is the common tangent through it. The gold $\omega$ is the original endowment: the arrow is the lump-sum transfer of good 1 onto the price line ($\omega'$, hollow gold). Dots show each trader's best bundle on that line. With **convex** tastes both land on $x^*$ (green: it is the equilibrium from $\omega'$). With **non-convex** tastes for $B$ (curves bulging out), $B$ picks a corner, the dots part and no price clears the market.`,
      deps: ['micro-9.9', 'micro-4.6', 'fa-3.4'],
      see: ['micro-9.14'],
      refs: ['Varian Ch. 32'], tags: ['welfare', 'convexity'],
      credit: 'K. Arrow, 1951; G. Debreu, 1951 and 1954',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fundamental_theorems_of_welfare_economics' },
      viz(v) {
        const kind = v.select('$B$’s preferences', [{ value: 'cd', label: 'convex (Cobb–Douglas)' }, { value: 'sq', label: 'non-convex' }], 'cd');
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.6, { step: 0.01 });
        const s = boxStage(v, { title: 'supporting an efficient allocation by prices', height: 430 });
        v.legend([['purple', 'efficient allocations'], ['ink', 'supporting price line'], ['gold', 'endowment ω → ω′ (transfer)'], ['green', 'target = equilibrium'], ['red', 'market fails']]);
        let pareto = [], key = '';
        const setOf = () => {
          const k = `${kind.value}|${aS.value}`;
          if (k !== key) { const FA = cd(aS.value), FB = kind.value === 'cd' ? cd(0.35) : pref('sq'); pareto = kind.value === 'cd' ? contractCurve(FA, FB, 100) : paretoSearch(FA, FB, 60, 120); key = k; }
          return pareto;
        };
        const snap = (x, y) => { const P = setOf(); if (kind.value === 'cd') return nearestOnPath(s, P, x, y); let b = P[0], bd = Infinity; for (const q of P) { const d = Math.hypot(s.X(q[0]) - s.X(x), s.Y(q[1]) - s.Y(y)); if (d < bd) { bd = d; b = q; } } return b; };
        const T = s.handle(5, 3, { color: 'ink', r: 9, label: 'x*', labelPos: 'ne', constrain: snap });
        const H = s.handle(2, 8, { color: 'gold', r: 8, label: 'ω', labelPos: 'nw', constrain: { x: [0.4, W1 - 0.4], y: [0.4, W2 - 0.4] } });
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = kind.value === 'cd' ? cd(0.35) : pref('sq'), P = setOf();
          drawBox(s);
          if (kind.value === 'cd') s.path(P, { color: 'purple', width: 3, alpha: 0.9 }); else { s.dots(P, { r: 3, color: 'purple' }); }
          let [tx, ty] = snap(T.x, T.y); T.set(tx, ty);
          const p = FA.mrs(tx, ty);                         // the slope of A's curve at x*: the candidate price
          // lump-sum transfer: move good 1 so that ω′ lies on the price line through x* (else good 2)
          let ox = tx + (ty - H.y) / p, oy = H.y;
          if (ox < 0.05 || ox > W1 - 0.05) { ox = H.x; oy = ty - p * (H.x - tx); }
          ox = clamp(ox, 0.05, W1 - 0.05); oy = clamp(oy, 0.05, W2 - 0.05);
          const M = market(FA, FB, [ox, oy]), dA = M.demA(p), dB = M.boxB(p), ok = Math.hypot(dA[0] - dB[0], dA[1] - dB[1]) < 0.05 && Math.hypot(dA[0] - tx, dA[1] - ty) < 0.05;
          drawA(s, FA, FA.u(tx, ty), { width: 1.8 }); drawB(s, FB, FB.u(W1 - tx, W2 - ty), { width: 1.8 });
          priceLineBox(s, tx, ty, p, { width: 2.2 });
          s.dot(H.x, H.y, { r: 6, color: 'gold' }); s.dot(ox, oy, { r: 6, color: 'gold', hollow: true });
          if (Math.hypot(s.X(ox) - s.X(H.x), s.Y(oy) - s.Y(H.y)) > 16) s.arrow(H.x, H.y, ox, oy, { color: 'gold', width: 2 });
          s.dot(tx, ty, { r: 8, color: ok ? 'green' : 'ink' });
          s.dot(dA[0], dA[1], { r: 5.5, color: 'accent', hollow: true }); s.dot(dB[0], dB[1], { r: 5.5, color: 'orange', hollow: true });
          if (!ok) { s.clip(() => s.line(dA[0], dA[1], dB[0], dB[1], { color: 'red', width: 2.2, dash: [4, 3] }), [0, W1], [0, W2]); }
          const zr = M.roots(0.02, 50);
          s.corner(ok ? 'x* is the equilibrium after the transfer' : 'x* is not supported by any price', 'tl', { color: ok ? 'green' : 'red', weight: 700, plate: true });
          st = { p, tx, ty, ok, dA, dB, zr, z: M.z(p), oy, ox };
        });
        v.readout(() => {
          const { p, tx, ty, ok, dA, dB, zr, z } = st;
          return `Supporting price at $x^* = (${f2(tx)}, ${f2(ty)})$: $p_1/p_2 = MRS_A = ${f2(p, 3)}$. After the transfer $A$ chooses $(${f2(dA[0])}, ${f2(dA[1])})$ and $B$ chooses $(${f2(W1 - dB[0])}, ${f2(W2 - dB[1])})$ on that line; excess demand $z = (${f2(z[0])}, ${f2(z[1])})$. ${ok ? '**Both choose $x^*$: it is a Walrasian equilibrium.**' : `**They disagree**, and ${zr.length ? 'the market clears elsewhere, not at $x^*$' : 'no price at all clears the market from this endowment'}: $B$ takes a corner of the budget line.`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.11
    {
      num: '9.11', kind: 'Theorem', name: 'Core convergence (Edgeworth, Debreu–Scarf)',
      statement: String.raw`Replicate a two-type exchange economy $n$ times: $n$ consumers of type $A$ and $n$ of type $B$, each with the original endowment. Call an allocation an **equal-treatment** allocation if all consumers of one type receive the same bundle. Assume preferences are continuous, strictly convex and strongly monotone. Then (i) every Walrasian allocation, replicated, is in the core of the $n$-fold economy, for every $n$; (ii) the equal-treatment core of the $(n+1)$-fold economy is contained in the equal-treatment core of the $n$-fold economy; and (iii) as $n \to \infty$ the equal-treatment cores shrink to the set of Walrasian allocations: any allocation that is not Walrasian is blocked once $n$ is large enough. With one consumer of each type the core is a whole segment of the contract curve; with many it is, in the limit, the competitive allocation alone.`,
      idea: String.raw`A coalition of $a$ consumers of type $A$ and $b$ of type $B$ can block $x$ if the average of their endowments, weighted $a:b$, can be redistributed so that both types do better. Writing $\lambda = a/(a+b)$, it blocks when the point $\lambda\omega^A + (1-\lambda)\omega^B$ lies in $\lambda P_A + (1-\lambda)P_B$, where $P_i$ is the set of bundles type $i$ prefers to $x^i$. The ratio $\lambda$ can take only the values $a/(a+b)$ with $a, b \le n$, so a bigger $n$ makes more ratios available. An allocation that is not supported by a price line through the endowment point is blocked by some ratio, since the convex sets $P_A$, $P_B$ and the weighted endowment then no longer lie on the right sides of a common line; the rational ratios are dense, so eventually one blocks.`,
      caption: String.raw`Cobb–Douglas traders. **Slide the replication number $n$**: the green stretch of the contract curve is the equal-treatment core of the $n$-fold economy, found by testing every coalition of up to $n$ consumers of each type. It starts as the whole lens-segment and closes in on the Walrasian allocation (gold star). **Drag the black allocation** along the curve to see the smallest coalition that blocks it. The bars show the core's length for $n = 1, \ldots, 10$.`,
      deps: ['micro-9.4', 'micro-9.5'],
      see: ['micro-9.9'],
      refs: ['Varian Ch. 32'], tags: ['exchange', 'competition'],
      credit: 'F. Y. Edgeworth, 1881 (two types); G. Debreu & H. Scarf, 1963 (general theorem)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Core_(game_theory)' },
      viz(v) {
        const nS = v.slider('replication $n$ (consumers of each type)', 1, 10, 1, { int: true });
        const aS = v.slider('$A$: weight on good 1', 0.15, 0.85, 0.65, { step: 0.01 });
        const bS = v.slider('$B$: weight on good 1', 0.15, 0.85, 0.3, { step: 0.01 });
        const NM = 10;
        const R = boxStage(v, { title: 'the core of the n-fold replica', height: 400, weight: 1.15 });
        const G = v.stage({ x: [0.3, NM + 0.7], y: [0, 1.05], axes: 'box', gutter: true, height: 400, xlabel: 'replication n', ylabel: 'core length / contract curve (share)', title: 'the core shrinks', weight: 1, xticks: Array.from({ length: NM }, (_, i) => i + 1), minWidth: 260 });
        v.legend([['purple', 'contract curve'], ['green', 'equal-treatment core'], ['gold', 'Walrasian allocation'], ['ink', 'test allocation']]);
        const H = R.handle(3, 7, { color: 'gold', r: 8, label: 'ω', labelPos: 'ne', constrain: { x: [0.4, W1 - 0.4], y: [0.4, W2 - 0.4] } });
        const T = R.handle(6, 5, { color: 'ink', r: 8, label: 'x', labelPos: 'ne' });
        // reduced fractions a/b with a, b ≤ NM, each with the size max(a, b) of the smallest coalition that realises it
        const ratios = [];
        for (let a = 1; a <= NM; a++) for (let b = 1; b <= NM; b++) { let g = a, h = b; while (h) [g, h] = [h, g % h]; if (g === 1) ratios.push({ a, b, n: Math.max(a, b), r: a / b }); }
        ratios.sort((x, y) => x.n - y.n);
        const curveA = (a, L, nn = 70) => { const pts = []; for (let i = 0; i < nn; i++) { const x = 0.05 * 800 ** (i / (nn - 1)); pts.push([x, (L / x ** a) ** (1 / (1 - a))]); } return pts; };
        /** smallest n at which the allocation (A's bundle) is blocked (1 if by one type alone; Infinity if never up to NM) */
        const blockN = (FA, FB, wA, wB, x, y) => {
          const a0 = FA.u(x, y), b0 = FB.u(W1 - x, W2 - y), tol = 1e-7;
          if (FA.u(...wA) > a0 + tol || FB.u(...wB) > b0 + tol) return { n: 1, a: 1, b: 0 };
          const crv = curveA(FA.a, a0 * (1 + 1e-9));
          for (const q of ratios) {
            for (const zA of crv) {
              const zb = [wB[0] + q.r * (wA[0] - zA[0]), wB[1] + q.r * (wA[1] - zA[1])];
              if (zb[0] > 0 && zb[1] > 0 && FB.u(zb[0], zb[1]) > b0 + tol && zA[0] < 200 && zA[1] < 200) return { n: q.n, a: q.a, b: q.b };
            }
          }
          return { n: Infinity };
        };
        let st = {};
        v.render(() => {
          const FA = cd(aS.value), FB = cd(bS.value), wA = [H.x, H.y], wB = [W1 - H.x, W2 - H.y], M = market(FA, FB, wA);
          drawBox(R);
          const cur = contractCurve(FA, FB, 90), nb = cur.map((p) => blockN(FA, FB, wA, wB, p[0], p[1]).n);
          R.path(cur, { color: 'purple', width: 2.4, alpha: 0.75 });
          const coreOf = (n) => { const out = []; let seg = []; cur.forEach((p, i) => { if (nb[i] > n) seg.push(p); else if (seg.length) { out.push(seg); seg = []; } }); if (seg.length) out.push(seg); return out; };
          const tot = pathLength(cur), lens = Array.from({ length: NM }, (_, i) => coreOf(i + 1).reduce((t, c) => t + pathLength(c), 0) / tot);
          const n = nS.value;
          for (const c of coreOf(n)) R.path(c, { color: 'green', width: 7 });
          const roots = M.roots(0.05, 20), E = roots.length ? M.demA(roots[0].p) : null;
          if (E) { priceLineBox(R, H.x, H.y, roots[0].p, { width: 1.3, alpha: 0.6, dash: [5, 4] }); R.dot(E[0], E[1], { r: 8, color: 'gold' }); R.text('★', E[0], E[1], { size: 15, dy: 5, align: 'center' }); }
          R.dot(H.x, H.y, { r: 6, color: 'gold' });
          // test allocation: snap to the curve
          const q = nearestOnPath(R, cur, T.x, T.y); T.set(q[0], q[1]);
          const bl = blockN(FA, FB, wA, wB, q[0], q[1]);
          // bars
          G.hline(0, { color: 'muted', width: 1 });
          lens.forEach((l, i) => bar(G, i + 1, 0.66, 0, l, i + 1 === n ? 'green' : 'purple', { fillAlpha: i + 1 === n ? 0.85 : 0.45 }));
          st = { n, lens, bl, E, nbE: E ? blockN(FA, FB, wA, wB, E[0], E[1]).n : null, q };
        });
        v.readout(() => {
          const { n, lens, bl, nbE } = st;
          const blk = bl.n === Infinity ? `is not blocked by any coalition of up to ${NM} consumers of each type` : bl.b === 0 ? 'is blocked by a single consumer: he or she prefers the endowment' : `is blocked from $n = ${bl.n}$ on, by ${bl.a} consumer${bl.a > 1 ? 's' : ''} of type $A$ together with ${bl.b} of type $B$`;
          return `Core of the ${n}-fold economy: **${f2(lens[n - 1] * 100, 0)}%** of the contract curve (n = 1: ${f2(lens[0] * 100, 0)}%, n = ${NM}: ${f2(lens[NM - 1] * 100, 1)}%). The black allocation ${blk}. The Walrasian allocation is blocked ${nbE === Infinity ? 'by no coalition' : 'from $n = ' + nbE + '$ on (numerical slip)'}.`;
        });
      },
    },
  ],
};
