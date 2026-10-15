// Microeconomics — Chapter 2: Supply, demand and market equilibrium

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// Staircase through sorted unit values: unit i occupies [i·w, (i+1)·w] at height vals[i].
function stairs(vals, w = 1) { const out = []; vals.forEach((y, i) => out.push([i * w, y], [(i + 1) * w, y])); return out; }
// Roots of f on [a, b] by scanning for sign changes and bisecting.
function roots(f, a, b, n = 400) {
  const out = []; let x0 = a, f0 = f(a);
  for (let i = 1; i <= n; i++) {
    const x1 = a + ((b - a) * i) / n, f1 = f(x1);
    if (f0 === 0) out.push(x0); else if (f0 * f1 < 0) { let lo = x0, hi = x1, flo = f0; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, fm = f(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } } out.push((lo + hi) / 2); }
    x0 = x1; f0 = f1;
  }
  return out;
}
// The backward-bending labour-style supply used in 2.7 and 2.9 (quantity as a function of price).
const QS_BACK = (p) => 16 - p + 0.1 * (p - 3) * (p - 5.5) * (p - 8);
const QS_UP = (p) => 1.6 * p + 0.5;

export default {
  collection: 'micro',
  chapter: 2,
  title: 'Supply, demand and market equilibrium',
  summary: String.raw`Demand and supply curves are assembled from many individual reservation values and costs. Their intersection is the equilibrium of a competitive market, and the chapter asks three questions about it: when does a market-clearing price exist, does a market that is out of equilibrium find its way back, and how does the equilibrium move when the curves shift? The last is answered first by drawing and then by the implicit function theorem.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Definition', name: 'Demand curve and the law of demand',
      statement: String.raw`The **demand curve** of a market gives, for each price $p$, the quantity $Q_d(p)$ that buyers wish to buy. When each buyer wants at most one unit and buys it exactly when $p$ does not exceed his **reservation price** $r_i$, $Q_d(p) = \#\{i : r_i \ge p\}$: a non-increasing step function. The **law of demand** is the statement that $Q_d$ is non-increasing in the price (other things equal); with many buyers the steps become small and the curve is well approximated by a smooth decreasing one.`,
      idea: String.raw`Sort the reservation prices from highest to lowest and draw them as bars: the top edge is the inverse demand curve. A buyer who buys at price $p$ also buys at any lower price, so lowering the price can only add buyers. With $n$ buyers drawn from a population, $Q_d(p)/n$ is an empirical survival function, which converges uniformly to the population share $1 - F(p)$ (Glivenko–Cantelli).`,
      caption: String.raw`Drag the gold price line: buyers whose bar reaches it (blue) buy. Add buyers with the slider: the staircase of reservation prices, plotted against the share of buyers, closes in on the smooth population demand curve (purple dashed).`,
      deps: [], refs: ['Varian Ch. 1', 'Mankiw Ch. 4'], tags: ['demand'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Law_of_demand' },
      viz(v) {
        const nS = v.slider('number of buyers', 4, 200, 12, { int: true });
        const s = v.stage({ x: [0, 100], y: [0, 114], height: 340, axes: 'box', xlabel: '% of buyers', ylabel: 'price', xticks: [20, 40, 60, 80], title: 'reservation prices, highest first' });
        const Ph = s.handle(2, 45, { color: 'gold', label: 'price', labelPos: 'ne', constrain: (x, y) => [2, clamp(y, 1, 104)] });
        const rv = (u) => 3 + 95 * Math.pow(u, 0.7), share = (p) => (p <= 3 ? 1 : p >= 98 ? 0 : 1 - Math.pow((p - 3) / 95, 1 / 0.7));
        const values = (n) => { const r = v.rng(11); return Array.from({ length: n }, (_, i) => rv((i + r()) / n)).sort((a, b) => b - a); };
        let st = {};
        v.legend([['blue', 'buys at this price'], ['ink', 'demand staircase'], ['purple', 'population demand', { dash: true }]]);
        v.render(() => {
          const n = nS.value, R = values(n), p = Ph.y, w = 100 / n; let k = 0;
          R.forEach((r, i) => { const buy = r >= p; if (buy) k++; s.rect(i * w, 0, (i + 1) * w, r, { fill: buy ? 'blue' : 'faint', fillAlpha: buy ? 0.45 : 0.4, color: 'panel', width: n <= 60 ? 1 : 0, stroke: n <= 60 }); });
          s.path(stairs(R, w), { color: 'ink', width: 1.8 });
          s.curve((t) => [100 * share(t), t], 3, 98, { color: 'purple', width: 2, dash: [6, 4], n: 200 });
          s.hline(p, { color: 'gold', width: 1.6 }); s.line(k * w, 0, k * w, p, { color: 'gold', dash: [4, 3], width: 1.2 }); s.dot(k * w, p, { r: 4.5, color: 'gold' });
          let gap = 0; for (let i = 0; i <= 600; i++) { const q = (104 * i) / 600, c = R.filter((r) => r >= q).length / n; gap = Math.max(gap, Math.abs(c - share(q))); }
          st = { n, k, p, gap };
        });
        v.readout(() => `${st.k} of ${st.n} buyers have a reservation price ≥ ${v.fix(st.p, 1)}: quantity demanded ${st.k} (${v.fix((100 * st.k) / st.n, 1)}% of buyers). Lowering the price only adds buyers, so the staircase never rises to the right — the law of demand. Largest gap to the population curve: ${v.fix(100 * st.gap, 1)} percentage points (it shrinks as buyers are added).`);
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Concept', name: 'Demand shifters: income and related goods',
      statement: String.raw`Demand depends on more than the good's own price: $Q_d = D(p;\, m, p_s, p_c, \dots)$ with income $m$, prices of substitutes $p_s$ and complements $p_c$, tastes and the number of buyers. A change in the own price is a **movement along** the demand curve; a change in any other argument **shifts** the curve. A higher substitute price shifts demand right, a higher complement price shifts it left; higher income shifts it right for a **normal** good and left for an **inferior** good.`,
      idea: String.raw`The demand curve is a section of the function $D$ with every argument except $p$ held fixed. Moving $p$ moves along that section; moving another argument selects a different section. Here $D$ is linear, so the horizontal shift at every price is the sum of each shifter's contribution, read off as a chain of arrows.`,
      caption: String.raw`The own-price slider moves the point along the curve. Income, substitute and complement sliders shift the whole curve (dashed: the original); the chain of arrows at the current price splits the shift into the three contributions. Switch the good to **inferior** and the income arrow reverses.`,
      deps: ['micro-2.1'], refs: ['Mankiw Ch. 4'], tags: ['demand'],
      viz(v) {
        const P = v.slider('own price $p$', 5, 100, 50, { step: 1 });
        const I = v.slider('income $m$', 20, 80, 64, { step: 1 });
        const Ps = v.slider('substitute price $p_s$', 10, 70, 50, { step: 1 });
        const Pc = v.slider('complement price $p_c$', 10, 70, 34, { step: 1 });
        const kind = v.select('the good is', ['normal', 'inferior'], 'normal');
        const s = v.stage({ x: [0, 120], y: [0, 114], height: 360, axes: 'box', xlabel: 'Q', ylabel: 'p', title: String.raw`$Q_d = 70 - 0.8\,p \pm 0.5(m-50) + 0.5(p_s-40) - 0.5(p_c-40)$` });
        const parts = () => { const b = kind.value === 'normal' ? 1 : -1; return [['income', 'purple', b * 0.5 * (I.value - 50)], ['substitute', 'teal', 0.5 * (Ps.value - 40)], ['complement', 'pink', -0.5 * (Pc.value - 40)]]; };
        let st = {};
        v.legend([['muted', 'original demand', { dash: true }], ['blue', 'current demand'], ['purple', 'income'], ['teal', 'substitute price'], ['pink', 'complement price']]);
        v.render(() => {
          const pr = parts(), sh = pr.reduce((t, q) => t + q[2], 0), p = P.value, A = 70 + sh;
          s.fn((q) => (70 - q) / 0.8, { domain: [0, 70], color: 'muted', width: 1.6, dash: [6, 4] });
          s.fn((q) => (A - q) / 0.8, { domain: [Math.max(0, A - 0.8 * 110), A], color: 'blue', width: 2.6 });
          const q0 = Math.max(0, 70 - 0.8 * p), q1 = Math.max(0, A - 0.8 * p);
          s.line(0, p, Math.max(q0, q1), p, { color: 'faint', width: 1, dash: [3, 3] });
          let x = q0; pr.forEach(([name, col, d], k) => { if (Math.abs(d) > 0.4) { const y = p + 6 * (k + 1); s.arrow(x, y, x + d, y, { color: col, width: 2.2, head: 7 }); s.text(name, x + d / 2, y, { dy: -8, align: 'center', color: col, size: 10.5 }); x += d; } });
          s.dot(q0, p, { r: 5, color: 'muted', hollow: true }); s.dot(q1, p, { r: 6, color: 'blue' });
          s.text('D', A - 0.8 * 96, 96, { dx: 10, color: 'blue', size: 15, math: true });
          st = { pr, sh, p, q0, q1 };
        });
        v.readout(() => {
          const { pr, sh, p, q0, q1 } = st, f = (x) => (x >= 0 ? '+' : '−') + v.fix(Math.abs(x), 1);
          return `At $p = ${p}$: $Q_d = ${v.fix(q0, 1)}$ on the original curve, ${v.fix(q1, 1)} now — a shift of ${f(sh)} = income ${f(pr[0][2])} (${kind.value} good) ${f(pr[1][2])} from the substitute ${f(pr[2][2])} from the complement. Moving $p$ alone slides the point along a curve; every other variable moves the curve.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Definition', name: 'Supply curve and the law of supply',
      statement: String.raw`The **supply curve** gives, for each price $p$, the quantity $Q_s(p)$ that sellers wish to sell. When each seller can provide one unit at cost $c_j$ and sells exactly when $p \ge c_j$, $Q_s(p) = \#\{j : c_j \le p\}$: a non-decreasing step function. The **law of supply** says that $Q_s$ is non-decreasing in price, other things equal. A fall in costs (better technology, cheaper inputs) shifts the supply curve to the right, i.e. down.`,
      idea: String.raw`Sorted from lowest to highest, the costs form a rising staircase that is the inverse supply curve. Any seller willing to sell at $p$ is willing at higher prices, so raising the price only adds sellers. Each seller who sells earns $p - c_j$, the strip between his cost and the price: summed, the producer surplus. Cutting every cost by a factor lowers every step, so at any given price more sellers enter.`,
      caption: String.raw`Drag the gold price line: sellers whose cost lies below it (orange) sell, and the light strips above their bars are their surpluses. The technology slider cuts every cost by the same percentage: the staircase drops (dashed: before) and at the same price more units are offered.`,
      deps: [], refs: ['Mankiw Ch. 4'], tags: ['supply'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Supply_(economics)' },
      viz(v) {
        const tech = v.slider('technology: cost cut', 0, 0.5, 0.15, { step: 0.01, fmt: (x) => `${Math.round(100 * x)}%` });
        const s = v.stage({ x: [0, 21], y: [-6, 106], height: 340, axes: 'box', xticks: [5, 10, 15], xlabel: 'units (sellers)', ylabel: 'price', title: 'sellers’ costs, lowest first' });
        const Ph = s.handle(0.35, 52, { color: 'gold', label: 'price', labelPos: 'ne', constrain: (x, y) => [0.35, clamp(y, 1, 99)] });
        const n = 20, r = v.rng(5), C0 = Array.from({ length: n }, (_, i) => 8 + 82 * Math.pow((i + r()) / n, 1.3)).sort((a, b) => a - b);
        let st = {};
        v.legend([['orange', 'sells at this price'], ['gold', 'producer surplus'], ['muted', 'costs before the cut', { dash: true }]]);
        v.render(() => {
          const C = C0.map((c) => c * (1 - tech.value)), p = Ph.y; let k = 0, ps = 0;
          C.forEach((c, i) => { const sell = c <= p; if (sell) { k++; ps += p - c; s.rect(i, c, i + 1, p, { fill: 'gold', fillAlpha: 0.25, stroke: false }); } s.rect(i, 0, i + 1, c, { fill: sell ? 'orange' : 'faint', fillAlpha: sell ? 0.6 : 0.4, color: 'panel', width: 1 }); });
          if (tech.value > 0) s.path(stairs(C0), { color: 'muted', width: 1.4, dash: [5, 4] });
          s.path(stairs(C), { color: 'orange', width: 2.2 });
          s.hline(p, { color: 'gold', width: 1.6 }); s.line(k, 0, k, p, { color: 'gold', dash: [4, 3], width: 1.2 }); s.dot(k, p, { r: 4.5, color: 'gold' });
          st = { k, ps, p, k0: C0.filter((c) => c <= p).length };
        });
        v.readout(() => {
          const { k, ps, p, k0 } = st, pct = Math.round(100 * tech.value);
          const t = pct > 0 ? ` Before the ${pct}% cost cut only ${k0} would sell at this price: the supply curve has shifted right by ${k - k0} unit${k - k0 === 1 ? '' : 's'} here.` : ' Move the technology slider to cut every cost.';
          return `${k} sellers have cost ≤ ${v.fix(p, 1)}: quantity supplied ${k}, producer surplus $\\sum (p - c_j) = ${v.fix(ps, 1)}$. Raising the price only adds sellers — the law of supply.${t}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Concept', name: 'Market curves as horizontal sums',
      statement: String.raw`The market demand curve is the **horizontal sum** of the individual demand curves: at each price, $Q_d(p) = \sum_i q_i(p)$. If each $q_i$ is continuous and non-increasing and vanishes above a choke price $\bar p_i$, the market curve is continuous and non-increasing, with a kink at each $\bar p_i$ where another buyer enters; between kinks its slope $dQ/dp$ is the sum of the slopes of the buyers who are active. Market supply is the horizontal sum of individual supplies in the same way.`,
      idea: String.raw`Quantities, not prices, are added: at a common price each buyer chooses a quantity, and the market quantity is their total. A sum of continuous non-increasing functions is continuous and non-increasing; at a choke price a new term starts to contribute, so the derivative jumps by that buyer's slope, which is a kink in the graph.`,
      caption: String.raw`Drag the handles on the axes to set each buyer's choke price and maximum quantity. Drag the price on the right: the coloured bars show each buyer's quantity at that price on the left and their sum, stacked end to end, on the right. The market curve kinks wherever a buyer enters.`,
      deps: ['micro-2.1', 'micro-2.3'], refs: ['Varian Ch. 15'], tags: ['demand', 'aggregation'],
      viz(v) {
        const cols = ['blue', 'purple', 'teal'];
        const L = v.stage({ x: [-1.4, 45], y: [-3.5, 112], height: 340, axes: 'box', xlabel: 'q', ylabel: 'p', title: 'three buyers' });
        const M = v.stage({ x: [0, 112], y: [-3.5, 112], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'p', title: 'market demand = horizontal sum' });
        const init = [[90, 30], [62, 38], [36, 28]];
        const hp = init.map(([P], i) => L.handle(0, P, { color: cols[i], constrain: (x, y) => [0, clamp(y, 5, 102)] }));
        const hq = init.map(([, Q], i) => L.handle(Q, 0, { color: cols[i], constrain: (x) => [clamp(x, 3, 44), 0] }));
        const pr = M.handle(1.5, 45, { color: 'gold', label: 'price', labelPos: 'ne', constrain: (x, y) => [1.5, clamp(y, 0.5, 103)] });
        let st = {};
        v.legend([['blue', 'buyer 1'], ['purple', 'buyer 2'], ['teal', 'buyer 3'], ['ink', 'market']]);
        v.render(() => {
          const P = hp.map((h) => h.y), Q = hq.map((h) => h.x), p = pr.y;
          const q = (i, pp) => (pp >= P[i] ? 0 : Q[i] * (1 - pp / P[i])), D = (pp) => q(0, pp) + q(1, pp) + q(2, pp);
          L.hline(p, { color: 'gold', width: 1.3 }); M.hline(p, { color: 'gold', width: 1.3 });
          for (let i = 0; i < 3; i++) {
            L.line(0, P[i], Q[i], 0, { color: cols[i], width: 2.4 });
            const qi = q(i, p); if (qi > 0) { const y = p + (1 - i) * 2.2; L.line(0, y, qi, y, { color: cols[i], width: 4, alpha: 0.75 }); L.dot(qi, p, { r: 4, color: cols[i] }); }
          }
          const pts = []; for (let k = 0; k <= 420; k++) { const pp = (106 * k) / 420; pts.push([D(pp), pp]); }
          M.path(pts, { color: 'ink', width: 2.6 });
          const order = [0, 1, 2].sort((a, b) => P[b] - P[a]);
          order.forEach((i, r) => { const x = D(P[i]); M.line(0, P[i], x, P[i], { color: cols[i], dash: [3, 3], width: 1 }); M.dot(x, P[i], { r: 4.5, color: cols[i] }); M.text(r === 0 ? `buyer ${i + 1} alone` : `buyer ${i + 1} enters`, x, P[i], { dx: 8, dy: -7, color: cols[i], size: 11 }); });
          let x = 0; for (let i = 0; i < 3; i++) { const qi = q(i, p); if (qi > 0) { M.line(x, p, x + qi, p, { color: cols[i], width: 7, alpha: 0.75 }); x += qi; } }
          M.dot(x, p, { r: 5, color: 'gold' });
          st = { qs: [0, 1, 2].map((i) => q(i, p)), P, p, Q: D(p) };
        });
        v.readout(() => {
          const { qs, P, p, Q } = st, f = (x) => v.fix(x, 1);
          const off = [0, 1, 2].filter((i) => qs[i] === 0).map((i) => `buyer ${i + 1}’s choke price ${f(P[i])} is below $p$`);
          return `At $p = ${f(p)}$: $q_1 + q_2 + q_3 = ${f(qs[0])} + ${f(qs[1])} + ${f(qs[2])} = Q = ${f(Q)}$${off.length ? ` (${off.join('; ')})` : ''}. Kinks at $p = ${P.map(f).sort((a, b) => b - a).join(', ')}$, where a buyer enters and the market curve's slope picks up that buyer's slope.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Model', name: 'Supply–demand equilibrium',
      statement: String.raw`In a competitive market, an **equilibrium** is a price $p^*$ at which the quantity demanded equals the quantity supplied, $Q_d(p^*) = Q_s(p^*) = Q^*$; graphically, the crossing of the two curves. At any price above $p^*$ there is a **surplus** (glut) $Q_s - Q_d > 0$; below $p^*$ a **shortage** $Q_d - Q_s > 0$. If the price is held away from $p^*$, the quantity traded is the smaller of the two, $\min(Q_d, Q_s) < Q^*$.`,
      scope: String.raw`Many price-taking buyers and sellers of a homogeneous good, full information, no transaction costs; the model describes where the market rests, not how quickly it gets there (2.7).`,
      idea: String.raw`With demand decreasing and supply increasing, the excess demand $Q_d - Q_s$ is decreasing and changes sign at most once, so the crossing is unique if it exists (existence is 2.6). Away from it one side of the market is rationed: at a high price sellers cannot find buyers, at a low price buyers cannot find sellers, and voluntary trade is limited by the short side.`,
      caption: String.raw`Drag the four handles to move the curves; the equilibrium is found by bisection. With **pin the price** on, slide the pinned price above or below $P^*$: the shaded gap is the glut or the shortage, and the arrow shows which way the unsatisfied side pushes the price.`,
      deps: ['micro-2.1', 'micro-2.3'], refs: ['Mankiw Ch. 4', 'Varian Ch. 16'], tags: ['equilibrium', 'markets'],
      credit: 'Alfred Marshall, 1890 (Principles of Economics)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Supply_and_demand' },
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 112], height: 360, axes: 'box', xlabel: 'Q', ylabel: 'P' });
        const pin = v.toggle('pin the price', true);
        const pp = v.slider('pinned price', 5, 100, 34, { step: 0.5 });
        const free = () => v.econ('market', E.D, E.S, 100);
        const E = v.curves(s, {
          demand: { linear: [[10, 92], [92, 18]] }, supply: { linear: [[10, 14], [92, 86]] }, shade: [],
          ceiling: () => { if (!pin.value) return null; const r = free(); return r && pp.value < r.p0 ? pp.value : null; },
          floor: () => { if (!pin.value) return null; const r = free(); return r && pp.value > r.p0 ? pp.value : null; },
        });
        v.legend([['blue', 'demand'], ['orange', 'supply'], ['red', 'shortage'], ['purple', 'glut']]);
        v.render(() => {
          pp.el.hidden = !pin.value; E.draw(); const r = E.result; if (!r) return;
          if (r.shortage > 0.05) { s.rect(r.q, r.pb - 2.4, r.q + r.shortage, r.pb + 2.4, { fill: 'red', fillAlpha: 0.22, stroke: false }); s.arrow(5, r.pb, 5, r.pb + 12, { color: 'red', width: 2, head: 7 }); s.text('price pushed up', 7, r.pb + 9, { color: 'red', size: 11 }); }
          if (r.excess > 0.05) { s.rect(r.q, r.pb - 2.4, r.q + r.excess, r.pb + 2.4, { fill: 'purple', fillAlpha: 0.22, stroke: false }); s.arrow(5, r.pb, 5, r.pb - 12, { color: 'purple', width: 2, head: 7 }); s.text('price pushed down', 7, r.pb - 9, { color: 'purple', size: 11 }); }
        });
        v.readout(() => {
          const r = E.result; if (!r) return 'The curves do not cross in view: no equilibrium.'; const f = (x) => v.fix(x, 1);
          const head = `Equilibrium (bisection on $D - S$): $P^* = ${f(r.p0)}$, $Q^* = ${f(r.q0)}$.`;
          if (r.shortage > 0.05) return `${head} Pinned at $P = ${f(r.pb)}$: buyers want ${f(r.q + r.shortage)}, sellers offer ${f(r.q)} → **shortage ${f(r.shortage)}**; only ${f(r.q)} units trade.`;
          if (r.excess > 0.05) return `${head} Pinned at $P = ${f(r.pb)}$: sellers offer ${f(r.q + r.excess)}, buyers want ${f(r.q)} → **glut ${f(r.excess)}**; only ${f(r.q)} units trade.`;
          return `${head} At this price the market clears: nobody who wants to trade at $P^*$ is turned away.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Theorem', name: 'Existence of a market-clearing price',
      statement: String.raw`Let demand $Q_d$ and supply $Q_s$ be continuous functions of the price on $[0, \bar p]$, and let the excess demand $z(p) = Q_d(p) - Q_s(p)$ satisfy $z(0) > 0$ (at a zero price buyers want more than is offered) and $z(\bar p) < 0$ (at a high enough price sellers offer more than is wanted). Then there is a price $p^* \in (0, \bar p)$ with $z(p^*) = 0$. If in addition $z$ is strictly decreasing, $p^*$ is unique. Without continuity the conclusion can fail.`,
      idea: String.raw`Excess demand is continuous, positive at the left end and negative at the right, so the intermediate value theorem (Rudin 4.23) gives a zero; bisection finds it by keeping the half-interval on which the sign still changes. A jump in supply (a lumpy plant that opens at a threshold price) lets $z$ leap from positive to negative without passing through zero: bisection still narrows down on the jump, but no price there clears the market.`,
      caption: String.raw`Shape the curves with the curvature sliders: $z(p)$ on the right always starts positive and ends negative, and the bars underneath are the first bisection intervals closing in on its zero. Switch on **supply jumps**: when the jump straddles the demand curve, $z$ skips over zero and no market-clearing price exists. Move the opening price to see an equilibrium reappear.`,
      deps: ['micro-2.5', 'pma-4.23'], refs: ['Varian Ch. 16'], tags: ['equilibrium', 'existence'],
      viz(v) {
        const gd = v.slider('demand curvature', 0.4, 2.5, 1, { step: 0.05 });
        const gs = v.slider('supply curvature', 0.4, 2.5, 1, { step: 0.05 });
        const jump = v.toggle('supply jumps (a lumpy plant)', true);
        const pj = v.slider('price at which the plant opens', 10, 90, 40, { step: 0.5 });
        const Qd = (p) => 100 * Math.pow(Math.max(0, 1 - p / 100), gd.value);
        const base = (p) => 100 * Math.pow(Math.max(0, p) / 100, gs.value) * (jump.value ? 0.6 : 1);
        const Qs = (p) => base(p) + (jump.value && p >= pj.value ? 40 : 0), z = (p) => Qd(p) - Qs(p);
        const L = v.stage({ x: [0, 105], y: [0, 108], height: 340, axes: 'box', xticks: [20, 40, 60, 80], xlabel: 'Q', ylabel: 'p', title: 'demand and supply' });
        const R = v.stage({ x: [0, 100], y: [-162, 112], height: 340, axes: 'box', yticks: [-100, -50, 0, 50, 100], xlabel: 'p', ylabel: 'z(p)', title: String.raw`excess demand $z(p) = Q_d(p) - Q_s(p)$` });
        let st = {};
        v.legend([['blue', 'demand'], ['orange', 'supply'], ['purple', 'excess demand'], ['gold', 'bisection intervals']]);
        v.render(() => {
          pj.el.hidden = !jump.value; const J = jump.value ? pj.value : null;
          L.curve((t) => [Qd(t), t], 0, 100, { color: 'blue', width: 2.4, n: 200 });
          if (J == null) L.curve((t) => [Qs(t), t], 0, 100, { color: 'orange', width: 2.4, n: 200 });
          else { L.curve((t) => [base(t), t], 0, J - 1e-9, { color: 'orange', width: 2.4 }); L.curve((t) => [Qs(t), t], J, 100, { color: 'orange', width: 2.4 }); L.line(base(J), J, Qs(J), J, { color: 'red', width: 1.2, dash: [4, 3] }); L.dot(base(J), J, { r: 4, color: 'orange', hollow: true }); L.dot(Qs(J), J, { r: 4, color: 'orange' }); }
          // bisection
          let a = 0, b = 100; const iv = [];
          for (let k = 0; k < 50; k++) { if (k < 8) iv.push([a, b]); const m = (a + b) / 2; if (z(m) > 0) a = m; else b = m; }
          const pb = (a + b) / 2, zl = z(pb - 1e-7), zr = z(pb + 1e-7), clears = Math.abs(z(pb)) < 1e-4 || (zl > 0 && zr < 0 && Math.abs(zl - zr) < 1e-3);
          R.hline(0, { color: 'muted', width: 1 });
          if (J == null) R.fn(z, { domain: [0, 100], color: 'purple', width: 2.4, n: 600 }); else { R.fn(z, { domain: [0, J - 1e-9], color: 'purple', width: 2.4, n: 300 }); R.fn(z, { domain: [J, 100], color: 'purple', width: 2.4, n: 300 }); }
          iv.forEach(([x0, x1], k) => { const y = -114 - 6 * k; R.line(x0, y, x1, y, { color: 'gold', width: 4, alpha: 0.85 }); });
          R.text('bisection intervals', 99, -114, { dy: -9, align: 'right', color: 'gold', size: 10.5 });
          if (clears) { R.dot(pb, 0, { r: 5, color: 'green', label: 'p*', labelPos: 'ne' }); L.dot(Qd(pb), pb, { r: 5, color: 'green', label: 'equilibrium', labelPos: 'e' }); }
          else { R.dot(pb, zl, { r: 4.5, color: 'red' }); R.dot(pb, zr, { r: 4.5, color: 'red', hollow: true }); R.line(pb, zl, pb, zr, { color: 'red', dash: [3, 3], width: 1.2 }); R.text('z skips 0', pb, 0, { dx: 8, dy: -10, color: 'red', size: 11.5, weight: 600 }); L.text('no market-clearing price', 52, 96, { align: 'center', color: 'red', size: 12.5, weight: 600 }); }
          st = { pb, zl, zr, clears, z0: z(0), z1: z(100), J };
        });
        v.readout(() => {
          const { pb, zl, zr, clears, z0, z1, J } = st, f = (x) => v.fix(x, 1);
          const ends = `$z(0) = ${f(z0)} > 0 > z(100) = ${f(z1)}$.`;
          if (clears) return `${ends} ${J == null ? '$z$ is continuous, so by the intermediate value theorem it has a zero' : `The jump at $p = ${f(J)}$ does not straddle demand, and $z$ is continuous where it crosses`}: bisection converges to $p^* = ${v.fix(pb, 3)}$ with $z(p^*) = ${v.fix((zl + zr) / 2, 3)}$ — the market clears.`;
          return `${ends} But supply jumps at $p = ${f(J)}$: $z$ falls from ${f(zl)} to ${f(zr)} without passing through 0. Bisection still homes in on $p = ${v.fix(pb, 3)}$, yet **no price clears the market** — continuity, the hypothesis of the IVT, fails.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Model', name: 'Price adjustment and stability',
      statement: String.raw`In **tâtonnement** price adjustment the price rises when there is excess demand and falls when there is excess supply: $\dot p = \kappa\, z(p)$ with $\kappa > 0$. An equilibrium $p^*$ ($z(p^*) = 0$) is locally stable if $z'(p^*) < 0$ and unstable if $z'(p^*) > 0$. With downward-sloping demand and upward-sloping supply $z' < 0$ everywhere and the price converges to the unique equilibrium from any start; with a supply curve that bends backward more steeply than demand slopes down, an equilibrium with $z' > 0$ appears, and prices starting near it run away to a neighbouring stable equilibrium.`,
      scope: String.raw`A thought experiment (Walras's auctioneer): no trade happens out of equilibrium, and the speed $\kappa$ is arbitrary. Real markets adjust through trades at disequilibrium prices (2.11).`,
      idea: String.raw`Near $p^*$, $\dot p \approx \kappa z'(p^*)(p - p^*)$, a linear equation whose solutions decay like $e^{\kappa z'(p^*) t}$ when $z'(p^*) < 0$ and grow when $z'(p^*) > 0$. In one dimension the picture is global: the price moves monotonically toward the zero of $z$ in the direction of the sign of $z$, so the zeros with $z' < 0$ attract and those with $z' > 0$ separate their basins.`,
      caption: String.raw`Drag the start price; the animation runs the auctioneer from there (left: the current price and the gap between the quantities demanded and supplied; right: the price over time, with faint paths from other starts). With **backward-bending** supply there are three equilibria: green ones attract, the red one in the middle repels. Switch to **ordinary** supply and every path homes in on the single equilibrium.`,
      deps: ['micro-2.6'], refs: ['CORE Unit 11'], tags: ['equilibrium', 'stability'],
      credit: 'Léon Walras, 1874; stability conditions by Paul Samuelson, 1941',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tâtonnement' },
      viz(v) {
        const mode = v.select('supply', [{ value: 'back', label: 'backward-bending' }, { value: 'up', label: 'ordinary' }], 'back', { onChange: () => v.restart() });
        const kap = v.slider('adjustment speed $\\kappa$', 0.1, 0.8, 0.35, { step: 0.01, onChange: () => v.restart() });
        const Qd = (p) => 16 - p, Qs = (p) => (mode.value === 'up' ? QS_UP(p) : QS_BACK(p)), z = (p) => Qd(p) - Qs(p);
        const L = v.stage({ x: [0, 20], y: [0, 11.3], height: 340, axes: 'box', xlabel: 'Q', ylabel: 'p', title: 'the auctioneer’s price' });
        const T = v.stage({ x: [0, 12], y: [0, 11.3], height: 340, xticks: [2, 4, 6, 8, 10], axes: 'box', xlabel: 'time', ylabel: 'p', title: String.raw`price paths $\dot p = \kappa\, z(p)$` });
        const h0 = L.handle(0.5, 5.2, { color: 'gold', label: 'start', labelPos: 'e', constrain: (x, y) => [0.5, clamp(y, 0.3, 10.2)] });
        h0.onDrag = () => v.restart();
        const path = (p0) => { const dt = 0.03, out = [[0, p0]]; let p = p0; for (let t = dt; t <= 12 + 1e-9; t += dt) { const k = kap.value, f = (q) => k * z(clamp(q, 0, 10.5)); const k1 = f(p), k2 = f(p + (dt * k1) / 2), k3 = f(p + (dt * k2) / 2), k4 = f(p + dt * k3); p = clamp(p + (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6, 0, 10.5); out.push([t, p]); } return out; };
        let fanKey = '', fan = [], st = {};
        v.legend([['blue', 'demand'], ['orange', 'supply'], ['green', 'stable equilibrium', { dot: true }], ['red', 'unstable equilibrium', { dot: true }], ['gold', 'price path']]);
        v.animate((t) => {
          const key = mode.value + kap.value; if (key !== fanKey) { fanKey = key; fan = [0.6, 1.6, 2.6, 3.6, 4.6, 5.3, 5.7, 6.4, 7.4, 8.4, 9.4, 10.2].map(path); }
          const eqs = roots(z, 0.01, 10.4).map((p) => ({ p, stable: (z(p + 1e-4) - z(p - 1e-4)) < 0 }));
          L.curve((q) => [Qd(q), q], 0, 10.5, { color: 'blue', width: 2.4 }); L.curve((q) => [Qs(q), q], 0, 10.5, { color: 'orange', width: 2.4, n: 200 });
          L.text('D', Qd(10.2), 10.2, { dx: 8, color: 'blue', size: 15, math: true }); L.text('S', Qs(10.2), 10.2, { dx: 8, color: 'orange', size: 15, math: true });
          for (const e of eqs) { L.dot(Qd(e.p), e.p, { r: 5.5, color: e.stable ? 'green' : 'red', hollow: !e.stable }); T.hline(e.p, { color: e.stable ? 'green' : 'red', dash: [5, 4], width: 1.2 }); }
          for (const P of fan) T.path(P, { color: 'muted', width: 1, alpha: 0.45 });
          const P = path(h0.y), n = Math.min(P.length - 1, Math.round(t / 0.03)), p = P[n][1];
          T.path(P.slice(0, n + 1), { color: 'gold', width: 2.8 }); T.dot(P[n][0], p, { r: 5, color: 'gold' });
          const qd = Qd(p), qs = Qs(p), zz = qd - qs;
          L.hline(p, { color: 'gold', width: 1.3 });
          if (Math.abs(zz) > 0.15) { L.arrow(qs, p, qd, p, { color: zz > 0 ? 'red' : 'purple', width: 2, both: true, head: 6 }); L.text(zz > 0 ? 'excess demand: p rises' : 'excess supply: p falls', (qd + qs) / 2, p, { dy: zz > 0 ? -10 : 12, align: 'center', color: zz > 0 ? 'red' : 'purple', size: 11 }); }
          st = { p, qd, qs, zz, eqs };
        }, { period: 12, still: 7 });
        v.readout(() => {
          const { p, qd, qs, zz, eqs } = st; if (!eqs) return ''; const f = (x) => v.fix(x, 2);
          const list = eqs.map((e) => `${f(e.p)} (${e.stable ? '$z\' < 0$: stable' : '$z\' > 0$: **unstable**'})`).join(', ');
          return `Price ${f(p)}: $Q_d = ${f(qd)}$, $Q_s = ${f(qs)}$, excess demand $z = ${f(zz)}$ → the auctioneer ${Math.abs(zz) < 0.005 ? 'stops' : zz > 0 ? 'raises' : 'lowers'} the price. Equilibria at $p = $ ${list}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8', kind: 'Concept', name: 'Comparative statics of supply and demand',
      statement: String.raw`With downward-sloping demand and upward-sloping supply, an increase in demand (a rightward shift) raises both the equilibrium price and quantity; an increase in supply lowers the price and raises the quantity; decreases do the reverse. When both curves shift, one of the two directions is determined and the other is not: if both increase, $Q^*$ rises but $p^*$ may move either way; if demand rises while supply falls, $p^*$ rises but $Q^*$ may move either way. The undetermined direction depends on the relative sizes of the shifts and the slopes.`,
      idea: String.raw`A rightward demand shift moves the crossing up and to the right along the fixed supply curve; a rightward supply shift moves it down and to the right along the fixed demand curve. When both happen, quantity effects that agree add up, while price effects that disagree compete; with linear curves $\Delta p^* = (\Delta D - \Delta S)/(b + d)$ and $\Delta Q^* = (d\,\Delta D + b\,\Delta S)/(b + d)$, where $b, d$ are the price responses of demand and supply.`,
      caption: String.raw`Shift demand and supply horizontally with the sliders (dashed: the original curves; drag the handles to change slopes). The arrows on the axes report how the equilibrium price and quantity moved; the table predicts the signs from the directions of the shifts alone and shows a grey ? where the sign depends on the sizes.`,
      deps: ['micro-2.2', 'micro-2.5'], refs: ['Mankiw Ch. 4'], tags: ['comparative statics'],
      viz(v) {
        const dD = v.slider('demand shift $\\Delta D$', -30, 30, 18, { step: 1 });
        const dS = v.slider('supply shift $\\Delta S$', -30, 30, 12, { step: 1 });
        const s = v.stage({ x: [0, 110], y: [0, 112], height: 360, axes: 'box', xlabel: 'Q', ylabel: 'P', xticks: [20, 40, 60, 80], weight: 1.5 });
        const tb = v.stage({ x: [0, 4], y: [0, 4.3], height: 360, axes: false, title: 'predicted by the directions alone' });
        const E = v.curves(s, { demand: { linear: [[10, 92], [80, 18]], shift: () => dD.value }, supply: { linear: [[10, 14], [80, 86]], shift: () => dS.value }, shade: [] });
        const sg = (x) => (x > 0.5 ? 1 : x < -0.5 ? -1 : 0);
        const pred = (a, b) => ({ P: a === b && a !== 0 ? 0 / 0 : Math.sign(a - b), Q: a === -b && a !== 0 ? 0 / 0 : Math.sign(a + b) });
        let st = {};
        v.legend([['blue', 'demand'], ['orange', 'supply'], ['muted', 'before the shifts', { dash: true }], ['gold', 'equilibrium moves']]);
        v.render(() => {
          E.draw(); const r = E.result, r0 = v.econ('market', E.fn('demand', false), E.fn('supply', false), 110); if (!r || !r0) return;
          const a = sg(dD.value), b = sg(dS.value), pr = pred(a, b);
          s.dot(r0.q0, r0.p0, { r: 4.5, color: 'muted', hollow: true });
          if (Math.hypot(r.q0 - r0.q0, r.p0 - r0.p0) > 1) s.arrow(r0.q0, r0.p0, r.q0, r.p0, { color: 'gold', width: 2.2, head: 7 });
          const cP = isNaN(pr.P) ? 'muted' : 'green', cQ = isNaN(pr.Q) ? 'muted' : 'green';
          if (Math.abs(r.p0 - r0.p0) > 0.8) s.arrow(2.2, r0.p0, 2.2, r.p0, { color: cP, width: 3, head: 7 });
          if (Math.abs(r.q0 - r0.q0) > 0.8) s.arrow(r0.q0, 8, r.q0, 8, { color: cQ, width: 3, head: 7 });
          // table
          const lab = ['↑', '·', '↓'], sym = (x) => (isNaN(x) ? '?' : x > 0 ? '↑' : x < 0 ? '↓' : '–');
          tb.text('supply shifts →', 2.5, 4.05, { align: 'center', color: 'orange', size: 11.5, weight: 600 });
          [['right', 1], ['none', 0], ['left', -1]].forEach(([t2, sb], j) => tb.text(t2, 1.5 + j, 3.55, { align: 'center', color: 'orange', size: 11 }));
          [['right', 1], ['none', 0], ['left', -1]].forEach(([t2, sa], i) => {
            const y = 2.5 - i; tb.text(`D ${t2}`, 0.5, y, { align: 'center', baseline: 'middle', color: 'blue', size: 11 });
            [1, 0, -1].forEach((sb, j) => {
              const x = 1.5 + j, c = pred(sa, sb), cur = sa === a && sb === b;
              tb.rect(x - 0.47, y - 0.47, x + 0.47, y + 0.47, { fill: cur ? 'gold' : 'faint', fillAlpha: cur ? 0.35 : 0.18, color: cur ? 'gold' : 'faint', width: cur ? 2 : 1 });
              tb.text(`P ${sym(c.P)}`, x, y + 0.17, { align: 'center', baseline: 'middle', color: isNaN(c.P) ? 'muted' : 'ink', size: 12.5, weight: 600 });
              tb.text(`Q ${sym(c.Q)}`, x, y - 0.17, { align: 'center', baseline: 'middle', color: isNaN(c.Q) ? 'muted' : 'ink', size: 12.5, weight: 600 });
            });
          });
          void lab; st = { r, r0, pr };
        });
        v.readout(() => {
          const { r, r0, pr } = st; if (!r) return ''; const f = (x) => (x >= 0 ? '+' : '−') + v.fix(Math.abs(x), 1);
          const amb = isNaN(pr.P) ? ' The direction of $P^*$ is **not determined** by the directions of the shifts: it depends on their relative sizes (try making one shift larger).' : isNaN(pr.Q) ? ' The direction of $Q^*$ is **not determined** by the directions of the shifts: it depends on their relative sizes.' : ' Both directions follow from the directions of the shifts alone.';
          return `$P^*$: ${v.fix(r0.p0, 1)} → ${v.fix(r.p0, 1)} (${f(r.p0 - r0.p0)}), $Q^*$: ${v.fix(r0.q0, 1)} → ${v.fix(r.q0, 1)} (${f(r.q0 - r0.q0)}).${amb}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9', kind: 'Proposition', name: 'Comparative statics via the implicit function theorem',
      statement: String.raw`Let excess demand $z(p, \alpha)$ be continuously differentiable in the price $p$ and a parameter $\alpha$ (income, say), and let $z(p_0, \alpha_0) = 0$ with $\partial z/\partial p\,(p_0, \alpha_0) \ne 0$. Then near $\alpha_0$ there is a unique continuously differentiable equilibrium price $p^*(\alpha)$ with $p^*(\alpha_0) = p_0$ and $z(p^*(\alpha), \alpha) = 0$, and
$$\frac{dp^*}{d\alpha} = -\frac{\partial z/\partial \alpha}{\partial z/\partial p}.$$
In particular, if demand rises with $\alpha$ and $z$ is decreasing in $p$, the equilibrium price rises with $\alpha$. Where $\partial z/\partial p = 0$ the formula fails and the equilibrium can jump.`,
      idea: String.raw`This is the implicit function theorem (Rudin 9.28) for one equation in one unknown; the derivative formula follows by differentiating the identity $z(p^*(\alpha), \alpha) = 0$ with the chain rule. Geometrically the equilibria form the curve $z = 0$ in the $(\alpha, p)$ plane, and the theorem says this curve is a graph over $\alpha$ wherever it is not vertical. A backward-bending supply curve makes the curve fold back on itself; at the folds $\partial z/\partial p = 0$, the tangent is vertical, and a small change in $\alpha$ pushes the market onto another branch.`,
      caption: String.raw`The curve on the left is every equilibrium $(\alpha, p^*)$, computed from $z = 0$; drag the point along it. The blue tangent has the slope predicted by $-z_\alpha/z_p$, checked in the readout against a finite difference of the numerically solved price. On the right is $z(\cdot, \alpha)$ at the current $\alpha$ and its slope $z_p$ at the root. With **backward-bending** supply, drag towards a fold: $z_p \to 0$, the tangent turns vertical and the prediction blows up.`,
      deps: ['micro-2.8', 'pma-9.28'], refs: ['Varian Ch. 16'], tags: ['comparative statics'],
      viz(v) {
        const mode = v.select('supply', [{ value: 'back', label: 'backward-bending' }, { value: 'up', label: 'upward-sloping' }], 'back', { onChange: () => snap() });
        const Qs = (p) => (mode.value === 'up' ? QS_UP(p) : QS_BACK(p));
        const z = (p, a) => 16 - p + 3 * (a - 1) - Qs(p), za = 3, zp = (p, a) => (z(p + 1e-5, a) - z(p - 1e-5, a)) / 2e-5;
        const SA = 1.2, SP = 10; // scales used to project in screen-like coordinates
        const proj = (a, p) => { for (let i = 0; i < 60; i++) { const g = z(p, a), ga = za * SA, gp = zp(p, a) * SP, n2 = ga * ga + gp * gp; a -= (g * ga) / n2 * SA; p -= (g * gp) / n2 * SP; if (Math.abs(g) < 1e-10) break; } return [clamp(a, 0.4, 1.6), clamp(p, 0, 10)]; };
        const s = v.stage({ x: [0.4, 1.6], y: [0, 10], height: 340, axes: 'box', xlabel: 'α (income)', ylabel: 'p*', xticks: [0.6, 0.8, 1, 1.2], title: String.raw`equilibria: the curve $z(p, \alpha) = 0$` });
        const R = v.stage({ x: [0, 10], y: [-14, 18], height: 340, axes: 'box', xlabel: 'p', ylabel: 'z', title: String.raw`excess demand $z(\cdot, \alpha)$` });
        const H = s.handle(1.12, 6.5, { color: 'gold', label: 'equilibrium', labelPos: 'ne', constrain: (x, y) => proj(x, y) });
        function snap() { const [a, p] = proj(H.x, H.y); H.set(a, p); }
        snap();
        const newton = (p, a) => { for (let i = 0; i < 40; i++) { const d = zp(p, a); if (Math.abs(d) < 1e-9) return null; p -= z(p, a) / d; } return Math.abs(z(p, a)) < 1e-9 ? p : null; };
        let st = {};
        v.legend([['green', 'equilibria with $z_p < 0$'], ['red', 'equilibria with $z_p > 0$'], ['accent', 'IFT tangent'], ['gold', 'slope $z_p$ at the root', { dash: true }]]);
        v.render(() => {
          const a = H.x, p = H.y, alpha = (q) => 1 + (Qs(q) + q - 16) / 3;
          let prev = null; for (let i = 0; i <= 400; i++) { const q = (10 * i) / 400, pt = [alpha(q), q], c = zp(q, pt[0]) < 0 ? 'green' : 'red'; if (prev) s.line(prev[0], prev[1], pt[0], pt[1], { color: c, width: 2.8 }); prev = pt; }
          if (mode.value === 'back') for (const q of roots((x) => zp(x, 1), 0.5, 9.5)) s.dot(alpha(q), q, { r: 4.5, color: 'ink', hollow: true, label: 'fold', labelPos: 'e' });
          const d = zp(p, a), m = -za / d, X0 = s.X(a), Y0 = s.Y(p), dx = s.X(a + 0.1) - X0, dy = s.Y(p + 0.1 * m) - Y0, Lp = Math.hypot(dx, dy) || 1, k = 70 / Lp;
          s.line(a - 0.1 * k, p - 0.1 * m * k, a + 0.1 * k, p + 0.1 * m * k, { color: 'accent', width: 2 });
          s.vline(a, { color: 'faint', dash: [3, 3] });
          // right panel
          R.hline(0, { color: 'muted', width: 1 }); R.fn((q) => z(q, a), { domain: [0, 10], color: 'accent', width: 2.4 });
          for (const q of roots((x) => z(x, a), 0, 10)) R.dot(q, 0, { r: 4, color: zp(q, a) < 0 ? 'green' : 'red' });
          R.line(p - 1.5, -1.5 * d, p + 1.5, 1.5 * d, { color: 'gold', width: 2, dash: [6, 4] }); R.dot(p, 0, { r: 6, color: 'gold' });
          const h = 0.002, pp = newton(p, a + h), pm = newton(p, a - h), num = pp != null && pm != null && Math.abs(pp - pm) < 0.2 ? (pp - pm) / (2 * h) : null;
          st = { a, p, d, m, num };
        });
        v.readout(() => {
          const { a, p, d, m, num } = st, f = (x, k = 3) => v.fix(x, k);
          if (Math.abs(d) < 0.12) return `$\\alpha = ${f(a)}$, $p^* = ${f(p, 2)}$: $z_p = ${f(d)} \\approx 0$ — the IFT's hypothesis fails here. The predicted slope $-z_\\alpha/z_p = ${Math.abs(m) > 1e4 ? '\\pm\\infty' : f(m, 1)}$ blows up: the curve of equilibria has a vertical tangent (a fold), and pushing $\\alpha$ past it makes the equilibrium jump to another branch.`;
          const chk = num == null ? 'numerical slope unavailable (too close to a fold)' : `finite difference of the solved $p^*$: ${f(num)} ${Math.abs(num - m) < 1e-3 * Math.max(1, Math.abs(m)) ? '✓' : ''}`;
          return `$\\alpha = ${f(a)}$, $p^* = ${f(p, 2)}$: IFT slope $dp^*/d\\alpha = -z_\\alpha/z_p = -3/(${f(d)}) = ${f(m)}$; ${chk}.${d > 0 ? ' (This middle branch has $z_p > 0$: the IFT still applies, but the equilibrium is unstable under price adjustment, 2.7, and here a rise in income *lowers* the equilibrium price.)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Model', name: 'Cobweb model',
      statement: String.raw`Producers choose this season's output from last season's price, $Q_t = S(p_{t-1})$, and the price then adjusts so that buyers take the whole crop, $p_t = D^{-1}(Q_t)$. The equilibrium price $p^*$ is a fixed point of the map $g = D^{-1} \circ S$. For linear curves $p_t - p^* = -(d/b)(p_{t-1} - p^*)$, where $d = S'$ and $-b = D'$ are the quantity responses to price: prices oscillate around $p^*$ and converge if $d < b$ (supply less price-responsive than demand, i.e. the supply curve steeper than the demand curve in the usual diagram), cycle with period two if $d = b$, and diverge if $d > b$. For nonlinear curves the same holds locally with the slopes at the equilibrium.`,
      scope: String.raw`A stylized model of farm markets with a production lag and naive (backward-looking) expectations; with rational or adaptive expectations the oscillations are damped or disappear.`,
      idea: String.raw`The price map is $g(p) = D^{-1}(S(p))$, with derivative $g' = S'/D' = -d/b$. If $|g'| < 1$, $g$ is a contraction near $p^*$, and the contraction principle (Rudin 9.23) gives convergence at the geometric rate $d/b$; the alternating sign of $g'$ makes the path spiral, which is the cobweb drawn between the curves. If $|g'| > 1$ the deviations grow by the same factor each season.`,
      caption: String.raw`Watch the cobweb build season by season: up to supply (what farmers plant at last year's price), across to demand (the price that sells the crop). Pick a preset or drag the handles to change the slopes; the readout gives the slope ratio, the contraction factor of the price map. The right panel plots the price season by season.`,
      deps: ['micro-2.5', 'pma-9.23'], refs: ['CORE Unit 11'], tags: ['dynamics', 'stability'],
      credit: 'Nicholas Kaldor, 1934 (name); Mordecai Ezekiel, 1938 (“the cobweb theorem”)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cobweb_model' },
      viz(v) {
        const s = v.stage({ x: [0, 100], y: [0, 112], height: 360, axes: 'box', xlabel: 'Q', ylabel: 'P', title: 'planted at last season’s price' });
        const T = v.stage({ x: [0, 16], y: [0, 112], height: 360, axes: 'box', xticks: [5, 10], xlabel: 'season', ylabel: 'price', title: 'price season by season' });
        const E = v.curves(s, { demand: { linear: [[10, 92], [90, 22]] }, supply: { linear: [[30, 8], [76, 98]] }, shade: [] });
        const setPreset = (m) => { const r = E.result; if (!r) return; const k = { converges: 1.7, cycles: 0.875, explodes: 0.66 }[m], dd = Math.min(30, 46 / k); const [h0, h1] = E.c.supply.handles; h0.set(r.q0 - dd, r.p0 - k * dd); h1.set(r.q0 + dd, r.p0 + k * dd); };
        const preset = v.select('', ['converges', 'cycles', 'explodes'], 'converges', { onChange: (m) => { setPreset(m); v.restart(); } });
        const p0s = v.slider('first-season price', 5, 100, 70, { step: 1, onChange: () => v.restart() });
        let st = {};
        v.legend([['blue', 'demand'], ['orange', 'supply'], ['gold', 'cobweb']]);
        v.animate((t) => {
          E.draw(); const r = E.result; if (!r) return; void preset;
          const D = E.D, S = E.S, sl = (F) => (F(60) - F(40)) / 20, ratio = Math.abs(sl(D)) / Math.abs(sl(S));
          const ps = [p0s.value], qs = [], pts = [];
          for (let k = 0; k < 16; k++) { const p = ps[k], q = v.econ('root', (x) => S(x) - p, 0, 100); if (q == null) break; const pn = D(q); qs.push(q); pts.push([q, p], [q, clamp(pn, 0, 106)]); if (pn < 0 || pn > 106) { ps.push(pn); break; } ps.push(pn); }
          const n = Math.min(qs.length, Math.floor(t * 1.4));
          s.path(pts.slice(0, 2 * n), { color: 'gold', width: 2.2 }); for (let k = 0; k < n; k++) s.dot(pts[2 * k + 1][0], pts[2 * k + 1][1], { r: 3.2, color: 'gold' });
          if (qs.length) { s.line(0, ps[0], qs[0], ps[0], { color: 'gold', width: 1.2, dash: [4, 3] }); s.text('p₀', qs[0], ps[0], { dx: -8, dy: -9, align: 'right', color: 'gold', size: 14, math: true }); }
          T.hline(r.p0, { color: 'muted', dash: [5, 4] }); T.text('P*', 15.8, r.p0, { dy: -9, align: 'right', color: 'muted', size: 12, math: true });
          const ser = ps.slice(0, n + 1).map((p, k) => [k, clamp(p, 0, 106)]); T.path(ser, { color: 'gold', width: 2 }); T.dots(ser, { r: 3.5, color: 'gold' });
          st = { ratio, sD: sl(D), sS: sl(S), n, p: ps[n], p0: r.p0, out: ps.some((p) => p < 0 || p > 106) || qs.length < 16 && ps.length <= 16 };
        }, { period: 14, still: 12 });
        v.readout(() => {
          const { ratio, sD, sS, n, p, p0 } = st; if (ratio == null) return 'The curves do not cross.'; const f = (x, k = 2) => v.fix(x, k);
          const kind = Math.abs(ratio - 1) < 0.02 ? 'the map neither contracts nor expands: a permanent two-season cycle' : ratio < 1 ? `the price map is a **contraction** with factor ${f(ratio)}: each season the gap to $P^*$ shrinks by that factor and the cobweb spirals in` : `deviations **grow** by a factor ${f(ratio)} each season and the cobweb spirals out until prices leave the picture`;
          return `Slopes in the diagram: demand ${f(sD)}, supply ${f(sS)}; contraction factor $|g'| = |D'|/|S'| = ${f(ratio)}$ — ${kind}. Season ${n}: $p = ${f(p, 1)}$, $|p - P^*| = ${f(Math.abs(p - p0), 1)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Phenomenon', name: 'Experimental markets converge (double auction)',
      statement: String.raw`In laboratory **double auctions**, where buyers with privately known values and sellers with privately known costs call out bids and asks and may accept the best standing offer at any time, transaction prices move close to the competitive equilibrium predicted by the induced supply and demand curves within a few trading periods, and nearly all of the available gains from trade are realized, even with a handful of traders who know nothing of the curves.`,
      scope: String.raw`Observed in thousands of experiments since Smith (1962) for markets of a single good with stationary values and costs; convergence is slower or absent with other institutions (posted prices), changing parameters, or market power. Much of the efficiency survives even with “zero-intelligence” traders who bid randomly but never trade at a loss (Gode and Sunder, 1993), which points to the trading rules rather than the traders' rationality.`,
      idea: String.raw`Each trade must be acceptable to both sides, so a buyer with value $v$ never pays more than $v$ and a seller with cost $c$ never takes less than $c$. Buyers with high values and sellers with low costs are the most likely to trade early; as they leave, the remaining traders' values and costs pinch the feasible prices toward the crossing of the induced curves. The simulation uses zero-intelligence traders: bids are uniform below the trader's value, asks uniform above the cost, and a trade happens whenever a new bid meets the best ask or a new ask meets the best bid.`,
      caption: String.raw`The left panel shows the induced demand (values) and supply (costs) with the competitive price band; the right panel replays four trading periods of a continuous double auction, trade by trade, with each period's mean price as a solid bar. **Reshuffle** draws new values. Switch the traders to **may trade at a loss** and the budget constraint disappears: prices scatter and efficiency collapses.`,
      deps: ['micro-2.5'], refs: ['CORE Unit 8'], tags: ['markets', 'experiments'],
      credit: 'Vernon Smith, 1962; zero-intelligence traders by Gode & Sunder, 1993',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Double_auction' },
      viz(v) {
        const n = 12, rounds = 4, TOP = 130;
        let seed = 1, M = null;
        const zi = v.select('traders', [{ value: 'c', label: 'never trade at a loss' }, { value: 'u', label: 'may trade at a loss' }], 'c', { onChange: () => { run(); v.restart(); } });
        v.button('Reshuffle values', () => { seed++; run(); v.restart(); });
        const L = v.stage({ x: [0, 12.6], y: [0, TOP + 10], height: 340, axes: 'box', xticks: [2, 4, 6, 8, 10], xlabel: 'units', ylabel: 'value / cost', title: 'induced demand and supply' });
        const T = v.stage({ x: [0, 40], y: [0, TOP + 10], height: 340, axes: 'box', xlabel: 'trade', ylabel: 'price', title: 'transaction prices' });
        function run() {
          const r = v.rng(100 + 17 * seed), V = Array.from({ length: n }, () => 25 + 95 * r()).sort((a, b) => b - a), C = Array.from({ length: n }, () => 10 + 95 * r()).sort((a, b) => a - b);
          let q = 0; while (q < n && V[q] >= C[q]) q++;
          const lo = Math.max(C[q - 1] ?? 0, q < n ? V[q] : -Infinity), hi = Math.min(V[q - 1] ?? TOP, q < n ? C[q] : Infinity);
          let maxS = 0; for (let i = 0; i < q; i++) maxS += V[i] - C[i];
          const ra = v.rng(7 + 31 * seed), trades = [], cons = zi.value === 'c';
          for (let round = 0; round < rounds; round++) {
            const B = V.map((_, i) => i), S = C.map((_, i) => i); let bid = null, ask = null;
            for (let step = 0; step < 3000 && B.length && S.length; step++) {
              if (ra() < 0.5) {
                const k = Math.floor(ra() * B.length), i = B[k], price = cons ? 1 + ra() * (V[i] - 1) : 1 + ra() * (TOP - 1);
                if (ask && price >= ask.price) { trades.push({ price: ask.price, round, s: V[i] - C[ask.who] }); B.splice(k, 1); S.splice(S.indexOf(ask.who), 1); bid = ask = null; }
                else if (!bid || price > bid.price) bid = { price, who: i };
              } else {
                const k = Math.floor(ra() * S.length), j = S[k], price = cons ? C[j] + ra() * (TOP - C[j]) : 1 + ra() * (TOP - 1);
                if (bid && price <= bid.price) { trades.push({ price: bid.price, round, s: V[bid.who] - C[j] }); S.splice(k, 1); B.splice(B.indexOf(bid.who), 1); bid = ask = null; }
                else if (!ask || price < ask.price) ask = { price, who: j };
              }
            }
          }
          M = { V, C, q, lo, hi, maxS, trades };
        }
        run();
        let st = {};
        v.legend([['blue', 'values (demand)'], ['orange', 'costs (supply)'], ['green', 'competitive price band'], ['gold', 'transaction price', { dot: true }], ['ink', 'period mean']]);
        v.animate((t) => {
          const { V, C, q, lo, hi, trades } = M, N = trades.length, k = Math.min(N, Math.floor((t / 11) * N));
          L.hband(lo, hi, { color: 'green', alpha: 0.18 }); T.hband(lo, hi, { color: 'green', alpha: 0.18 });
          L.path(stairs(V), { color: 'blue', width: 2.4 }); L.path(stairs(C), { color: 'orange', width: 2.4 });
          L.vline(q, { color: 'green', dash: [4, 3], width: 1.2 }); L.text('Q*', q, 0, { dx: 5, dy: -12, color: 'green', size: 13, math: true });
          T.setView([0, Math.max(N, 4) + 1], [0, TOP + 10]);
          for (let r = 1; r < rounds; r++) { const i = trades.findIndex((x) => x.round === r); if (i >= 0) { T.vline(i + 0.5, { color: 'faint', dash: [4, 4] }); T.text(`period ${r + 1}`, i + 0.7, 5, { color: 'muted', size: 10.5 }); } }
          T.text('period 1', 0.3, 5, { color: 'muted', size: 10.5 });
          for (let r = 0; r < rounds; r++) { const idx = trades.map((x, i) => (x.round === r && i < k ? i : -1)).filter((i) => i >= 0); if (idx.length) { const m = idx.reduce((a, i) => a + trades[i].price, 0) / idx.length; T.line(idx[0] + 0.6, m, idx[idx.length - 1] + 1.4, m, { color: 'ink', width: 2.6 }); } }
          const pts = trades.slice(0, k).map((x, i) => [i + 1, x.price]);
          T.path(pts, { color: 'gold', width: 1.4, alpha: 0.7 }); pts.forEach((p, i) => T.dot(p[0], p[1], { r: 3.4, color: trades[i].s < 0 ? 'red' : 'gold' }));
          let S = 0; for (let i = 0; i < k; i++) S += trades[i].s;
          const last = trades.filter((x, i) => i < k && x.round === trades[Math.max(0, k - 1)]?.round), mid = (lo + hi) / 2;
          const rd = (trades[Math.max(0, k - 1)]?.round ?? 0) + 1;
          st = { k, N, S, maxS: M.maxS * rd, lo, hi, q, mean: last.length ? last.reduce((a, x) => a + x.price, 0) / last.length : null, dev: last.length ? last.reduce((a, x) => a + Math.abs(x.price - mid), 0) / last.length : null, losses: trades.slice(0, k).filter((x) => x.s < 0).length, round: (trades[Math.max(0, k - 1)]?.round ?? 0) + 1 };
        }, { period: 13, still: 12 });
        v.readout(() => {
          const { k, S, maxS, lo, hi, q, mean, dev, losses, round } = st; if (k == null) return ''; const f = (x) => v.fix(x, 1);
          const p = mean == null ? '' : ` Period ${round}: mean price ${f(mean)}, mean distance to the middle of the band ${f(dev)}.`;
          return `Competitive prediction: ${q} units per period at a price between ${f(lo)} and ${f(hi)}. ${k} trades so far.${p} Efficiency: surplus realized ${f(S)} of the maximum ${f(maxS)} over the periods so far = **${v.fix((100 * S) / maxS, 0)}%**${losses ? ` (${losses} loss-making trades)` : ''}.`;
        });
      },
    },
  ],
};
