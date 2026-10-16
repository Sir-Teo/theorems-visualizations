// Microeconomics — Chapter 10: Market power: monopoly and oligopoly (items 10.1–10.6; 10.7–10.12 in ch10-b.js, 10.13–10.17 in ch10-c.js, 10.18–10.22 in ch10-d.js)
import { clamp, GUIDE, fx, bisect, argmax, slopeLine, plateText, lin, iso, mstage, tag, integ, grid } from './ch10.shared.js';

export default {
  collection: 'micro',
  chapter: 10,
  title: 'Market power: monopoly and oligopoly',
  summary: String.raw`A firm facing a downward-sloping demand curve restricts output to raise its price, setting marginal revenue equal to marginal cost with a markup governed by the elasticity of demand. The chapter measures the resulting deadweight loss and studies how price discrimination, regulation and free entry change the picture. It then turns to industries with a few firms whose choices interact (the Cournot, Bertrand and Stackelberg models and the fragility of cartels), leaving the general theory of games to its own collection.`,
  items: [
    // ------------------------------------------------------------------ 10.1
    {
      num: '10.1', kind: 'Definition', name: 'Marginal revenue',
      statement: String.raw`Let a seller face the inverse demand curve $P(Q)$, so that total revenue is $R(Q) = Q\,P(Q)$. The **marginal revenue** is the extra revenue from selling one more unit,
$$MR(Q) = R'(Q) = P(Q) + Q\,P'(Q) = P(Q)\Bigl(1 + \frac1{\varepsilon}\Bigr), \qquad \varepsilon = \frac{dQ}{dP}\,\frac{P}{Q} < 0 .$$
For a price taker $P' = 0$ and $MR = P$. For a seller with a downward-sloping demand curve $P' < 0$, so $MR < P$: to sell an extra unit the price must fall on **every** unit, and $MR > 0$ exactly when demand is elastic, $|\varepsilon| > 1$.`,
      idea: String.raw`Selling $\Delta Q$ more units means cutting the price from $P(Q)$ to $P(Q+\Delta Q)$. The new units bring in $P(Q+\Delta Q)\,\Delta Q$ (the green strip), but the $Q$ units that would have sold anyway now fetch $P(Q) - P(Q+\Delta Q)$ less each (the red strip). Dividing the net by $\Delta Q$ and letting $\Delta Q \to 0$ gives $P + Q P'$. Writing $P' = P/(\varepsilon Q)$ gives the elasticity form, which is the link to the elasticity and revenue result of 3.2: revenue rises with quantity exactly where $MR > 0$.`,
      caption: String.raw`**Drag $Q$ and the step $\Delta Q$.** The green strip is the revenue from the new units, the red strip the revenue lost on the earlier ones; their difference over $\Delta Q$ is the gold dot, which sits on the purple marginal-revenue curve (exactly on it as $\Delta Q \to 0$). Right: the revenue curve $R(Q)$, whose slope is $MR$. With a **linear** demand $MR$ falls twice as fast as the demand curve and reaches zero where revenue peaks (unit elasticity); with **constant elasticity** it stays a fixed fraction $1 + 1/\varepsilon$ of the price.`,
      deps: ['micro-3.2'],
      refs: ['Varian Ch. 15', 'Mankiw Ch. 15'], tags: ['monopoly', 'revenue'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Marginal_revenue' },
      viz(v) {
        const kind = v.select('demand', [{ value: 'lin', label: 'linear' }, { value: 'iso', label: 'constant elasticity' }], 'lin');
        const qS = v.slider('quantity $Q$', 1, 7.8, 4, { step: 0.05 });
        const dS = v.slider('extra units $\\Delta Q$', 0.1, 2, 1, { step: 0.05 });
        const eS = v.slider('$|\\varepsilon|$ (constant-elasticity case)', 1.2, 5, 2, { step: 0.05 });
        const s = mstage(v, { x: [0, 10], y: [-6, 11], title: 'demand, marginal revenue, and what one more unit brings' });
        const R = v.stage({ x: [0, 10], y: [0, 30], axes: 'box', gutter: true, xlabel: 'quantity $Q$', ylabel: 'revenue $R$', height: 360, title: 'total revenue', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'demand $P(Q)$'], ['purple', 'marginal revenue'], ['green', 'gained on the new units', { area: true }], ['red', 'lost on the earlier units', { area: true }], ['gold', 'revenue change per extra unit', { dot: true }]]);
        let st = {};
        v.render(() => {
          const D = kind.value === 'lin' ? lin(10, 1) : iso(10, eS.value);
          eS.el.hidden = kind.value === 'lin';
          const q = qS.value, dq = dS.value, p0 = D.P(q), p1 = D.P(q + dq);
          const q0 = kind.value === 'lin' ? 0 : 0.9;
          s.hline(0, { color: 'muted', width: 1 });
          s.rect(0, p1, q, p0, { fill: 'red', fillAlpha: 0.3, color: 'red', width: 1.2, hatch: 'red', hatchAlpha: 0.3 });
          s.rect(q, 0, q + dq, p1, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.2 });
          s.clip(() => {
            s.fn(D.P, { domain: [Math.max(q0, 0.2), 10], color: 'accent', width: 2.6 });
            s.fn(D.MR, { domain: [Math.max(q0, 0.2), 10], color: 'purple', width: 2.6 });
          });
          tag(s, 'demand', 9.4, D.P(9.4) + 0.9, 'accent', { align: 'right' });
          tag(s, 'MR', kind.value === 'lin' ? 8.6 : 9.4, D.MR(kind.value === 'lin' ? 8.6 : 9.4) - 1.1, 'purple', { align: 'right' });
          const dR = (q + dq) * p1 - q * p0;
          s.dot(q + dq / 2, dR / dq, { r: 6, color: 'gold' });
          s.dot(q, D.MR(q), { r: 4, color: 'purple' });
          s.dot(q, p0, { r: 5, color: 'accent' });
          const Rf = (x) => x * D.P(x);
          R.fn(Rf, { domain: [Math.max(q0, 0.05), 10], color: 'ink', width: 2.4 });
          R.line(q, Rf(q), q + dq, Rf(q + dq), { color: 'gold', width: 2.4 });
          slopeLine(R, q, Rf(q), D.MR(q), 70, { color: 'purple', width: 2.2 });
          R.dot(q, Rf(q), { r: 5, color: 'ink' });
          st = { q, dq, p0, p1, dR, mr: D.MR(q), eps: D.eps(q), gain: p1 * dq, loss: q * (p0 - p1) };
        });
        v.readout(() => `$P(${fx(st.q)}) = ${fx(st.p0)}$, $\\varepsilon = ${fx(st.eps)}$: $P(1 + 1/\\varepsilon) = ${fx(st.p0 * (1 + 1 / st.eps))} = MR$ (the formula's value).\nGained $${fx(st.gain)}$ on the new units, lost $${fx(st.loss)}$ on the earlier ones: net $${fx(st.dR)}$, i.e. $${fx(st.dR / st.dq)}$ per extra unit (exact $MR$ at $Q$: $${fx(st.mr)}$).`);
      },
    },
    // ------------------------------------------------------------------ 10.2
    {
      num: '10.2', kind: 'Principle', name: 'Monopoly pricing: marginal revenue equals marginal cost',
      statement: String.raw`A profit-maximizing seller who faces the demand curve $P(Q)$ and has cost $C(Q)$ chooses the quantity $Q^m$ at which
$$MR(Q^m) = MC(Q^m),$$
provided marginal cost cuts marginal revenue from below (the second-order condition), and charges the **price read off the demand curve**, $P^m = P(Q^m)$, not the marginal revenue. Because $MR < P$, the monopoly price lies above marginal cost, $P^m > MC(Q^m)$; there is no supply curve, since the optimal price depends on the shape of demand as well as on cost. The firm produces only if $P^m$ covers average variable cost.`,
      idea: String.raw`Profit is $\pi(Q) = R(Q) - C(Q)$, so an interior maximum has $\pi'(Q) = 0$, which is $MR = MC$ (the first-order condition for an interior extremum, pma-5.8); the second derivative $MR' - MC' < 0$ makes it a maximum. The rule is the same as for a competitive firm, with $P$ replaced by $MR$: the monopolist weighs the revenue of one more unit net of the price cut on all the others (10.1) against the cost of making it. The price is then wherever the buyers' willingness to pay is at that quantity.`,
      caption: String.raw`**Drag $Q$ along the axis.** Left: demand (blue), marginal revenue (purple) and marginal cost (orange); the green rectangle is profit, $Q\,(P - AC)$. Right: the profit curve $\pi(Q)$ itself, with the maximum found by search. Profit is highest where the purple and orange curves cross, and **not** where price meets marginal cost (that is the larger output of a competitive industry) nor at the revenue maximum. Raise the slope of marginal cost or its level and the optimum slides along the demand curve.`,
      deps: ['micro-10.1', 'micro-7.11', 'pma-5.8'],
      refs: ['Varian Ch. 25', 'Mankiw Ch. 15'], tags: ['monopoly', 'optimization'],
      credit: 'A. A. Cournot, Recherches sur les principes mathématiques de la théorie des richesses, 1838 (chapter 5 treats the monopolist)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Monopoly_price' },
      viz(v) {
        const cS = v.slider('marginal cost at zero output $c$', 0, 6, 2, { step: 0.05 });
        const mS = v.slider('rise of marginal cost $m$', 0, 1, 0.25, { step: 0.01 });
        const D = lin(12, 1);
        const s = mstage(v, { x: [0, 12], y: [0, 13], title: 'marginal revenue = marginal cost' });
        const T = v.stage({ x: [0, 12], y: [-30, 40], axes: 'box', gutter: true, xlabel: 'quantity $Q$', ylabel: 'profit $\\pi$', height: 360, title: 'profit', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'demand'], ['purple', 'marginal revenue'], ['orange', 'marginal cost'], ['green', 'profit', { area: true }], ['gold', 'your output', { dot: true }]]);
        const H = s.handle(3, 0, { color: 'gold', r: 9, label: 'Q', labelPos: 'n', constrain: { x: [0.1, 11.8], y: [0, 0] } });
        let st = {};
        v.render(() => {
          const c = cS.value, m = mS.value, MC = (q) => c + m * q, Cf = (q) => c * q + (m * q * q) / 2, pi = (q) => q * D.P(q) - Cf(q);
          const best = argmax(pi, 0, 12, 96);
          const q = H.x, pq = D.P(q), ac = Cf(q) / q;
          s.rect(0, Math.min(pq, ac), q, Math.max(pq, ac), { fill: pq >= ac ? 'green' : 'red', fillAlpha: 0.28, color: pq >= ac ? 'green' : 'red', width: 1.2 });
          s.fn(D.P, { domain: [0, 12], color: 'accent', width: 2.6 });
          s.fn(D.MR, { domain: [0, 6], color: 'purple', width: 2.6 });
          s.fn(MC, { domain: [0, 12], color: 'orange', width: 2.6 });
          tag(s, 'demand', 0.1, 12, 'accent', { align: 'left', dy: 4 }); tag(s, 'MR', 5.9, 0.7, 'purple', { align: 'right' }); tag(s, 'MC', 11.9, MC(11.9) - 0.9, 'orange', { align: 'right' });
          s.vline(best.x, { color: 'muted', width: 1, dash: [3, 3] });
          s.dot(best.x, D.P(best.x), { r: 7, color: 'green' });
          s.dot(best.x, MC(best.x), { r: 5, color: 'orange' });
          s.dot(q, pq, { r: 5, color: 'accent' });
          T.fn(pi, { domain: [0, 12], color: 'ink', width: 2.4 });
          T.hline(0, { color: 'muted', width: 1 });
          T.dot(best.x, best.f, { r: 7, color: 'green' });
          T.dot(q, pi(q), { r: 6, color: 'gold' });
          st = { q, pq, ac, pi: pi(q), best, mr: D.MR(q), mc: MC(q), qc: (12 - c) / (1 + m) };
        });
        v.readout(() => `At your $Q = ${fx(st.q)}$: $MR = ${fx(st.mr)}$, $MC = ${fx(st.mc)}$, price $${fx(st.pq)}$, profit $${fx(st.pi)}$.\nBest by search: $Q^m = ${fx(st.best.x, 3)}$ with profit $${fx(st.best.f)}$ and price $${fx(12 - st.best.x)}$; at that output $MR - MC = ${fx(12 - 2 * st.best.x - (cS.value + mS.value * st.best.x), 3)}$. A price taker would produce $${fx(st.qc)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.3
    {
      num: '10.3', kind: 'Principle', name: 'Inverse-elasticity rule (Lerner index)',
      statement: String.raw`At the profit-maximizing output of a monopolist the proportional markup of price over marginal cost equals the reciprocal of the absolute price elasticity of demand at that point:
$$L \;=\; \frac{P - MC}{P} \;=\; \frac{1}{|\varepsilon|}.$$
Since $MC > 0$ forces $L < 1$, the monopolist always operates where demand is **elastic**, $|\varepsilon| > 1$. The index $L$ is $0$ for a price taker ($|\varepsilon| = \infty$) and grows without limit as demand becomes less elastic.`,
      idea: String.raw`Put the elasticity form of marginal revenue from 10.1, $MR = P(1 + 1/\varepsilon)$, into $MR = MC$ (10.2): $P(1 - 1/|\varepsilon|) = MC$, and rearrange. The markup is therefore decided by the buyers' sensitivity to price: a seller whose customers hardly react to a price rise (small $|\varepsilon|$) raises it a lot, one whose customers would flee (large $|\varepsilon|$) barely at all. If demand were inelastic at some output, $MR$ would be negative there and cutting output would raise revenue and cut cost, so the optimum cannot be in the inelastic stretch (3.1).`,
      caption: String.raw`Choose the demand family. **Constant elasticity:** slide $|\varepsilon|$ towards $1$ and the markup $1/|\varepsilon|$ explodes (right panel). **Linear demand:** slide the marginal cost $c$; the chosen point (green) always lands on the elastic upper half of the demand curve, where $|\varepsilon| > 1$ (the lower half, shaded, is inelastic and would have negative $MR$). The right panel plots the Lerner index against $|\varepsilon|$; the dot is the monopolist's choice.`,
      deps: ['micro-10.2', 'micro-3.1'],
      refs: ['Varian Ch. 25'], tags: ['monopoly', 'elasticity'],
      credit: 'A. P. Lerner, The Concept of Monopoly and the Measurement of Monopoly Power, Review of Economic Studies 1 (3): 157–175, 1934',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lerner_index' },
      viz(v) {
        const kind = v.select('demand', [{ value: 'iso', label: 'constant elasticity' }, { value: 'lin', label: 'linear' }], 'iso');
        const eS = v.slider('$|\\varepsilon|$', 1.05, 6, 2, { step: 0.01 });
        const cS = v.slider('marginal cost $c$', 0.5, 8, 3, { step: 0.05 });
        const s = mstage(v, { x: [0, 12], y: [0, 12], title: 'demand, marginal revenue and the chosen point' });
        const L = v.stage({ x: [1, 6], y: [0, 1], axes: 'box', gutter: true, xlabel: 'elasticity $|\\varepsilon|$', ylabel: 'markup $(P - MC)/P$', height: 360, title: 'Lerner index', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'demand'], ['purple', 'marginal revenue'], ['orange', 'marginal cost'], ['green', 'monopoly choice', { dot: true }]]);
        let st = {};
        v.render(() => {
          const lin_ = kind.value === 'lin';
          eS.el.hidden = lin_;
          const D = lin_ ? lin(12, 1) : iso(12, eS.value), c = cS.value;
          const q = bisect((x) => D.MR(x) - c, 0.001, 200, 70);
          const x1 = lin_ ? 12 : 12;
          if (lin_) s.rect(6, 0, 12, 6, { fill: 'red', fillAlpha: 0.1, stroke: false });
          s.clip(() => {
            s.fn(D.P, { domain: [0.15, x1], color: 'accent', width: 2.6 });
            s.fn(D.MR, { domain: [0.15, x1], color: 'purple', width: 2.6 });
            s.hline(c, { color: 'orange', width: 2.4 });
          });
          if (lin_) tag(s, 'inelastic stretch', 9, 1, 'red');
          if (q !== null && q <= 12) {
            const p = D.P(q), e = Math.abs(lin_ ? D.eps(q) : D.eps());
            s.vline(q, { color: 'muted', width: 1, dash: [3, 3] }); s.hline(p, { color: 'muted', width: 1, dash: [3, 3] });
            s.dot(q, p, { r: 7, color: 'green' }); s.dot(q, c, { r: 4, color: 'orange' });
            s.measure(q + 0.35, c, q + 0.35, p, 'markup');
            L.fn((x) => 1 / x, { domain: [1.0001, 6], color: 'ink', width: 2.4 });
            L.dot(Math.min(e, 6), (p - c) / p, { r: 7, color: 'green' });
            L.vline(1, { color: 'red', width: 1, dash: [3, 3] });
            st = { q, p, e, L: (p - c) / p };
          } else st = { q: NaN, p: NaN, e: NaN, L: NaN };
        });
        v.readout(() => Number.isNaN(st.q) ? 'At this marginal cost the seller does not produce within the window.' : `Monopoly output $${fx(st.q)}$ at price $${fx(st.p)}$: $|\\varepsilon| = ${fx(st.e, 3)}$, so $1/|\\varepsilon| = ${fx(1 / st.e, 3)}$.\nLerner index $(P - MC)/P = ${fx(st.L, 3)}$. The two agree, and $|\\varepsilon| ${st.e > 1 ? '>' : '\\le'} 1$.`);
      },
    },
    // ------------------------------------------------------------------ 10.4
    {
      num: '10.4', kind: 'Concept', name: 'Deadweight loss of monopoly',
      statement: String.raw`A monopolist produces $Q^m$ where $MR = MC$, which is less than the output $Q^c$ at which price equals marginal cost. Relative to the competitive outcome, buyers pay more on the $Q^m$ units sold, a **transfer** from consumers to the firm, and the $Q^c - Q^m$ units that are not produced would have been worth more to buyers than they cost. The **deadweight loss** is the surplus on those units,
$$DWL = \int_{Q^m}^{Q^c} \bigl(P(Q) - MC(Q)\bigr)\,dQ \;>\; 0 ,$$
a loss to society that nobody gains. With constant marginal cost the transfer is the rectangle $Q^m (P^m - MC)$.`,
      idea: String.raw`Total surplus, consumer surplus plus profit, is $\int_0^Q (P - MC)\,dQ$ when $Q$ units are made (3.6). It is maximal at $Q^c$, where the integrand changes sign. The monopolist stops at $Q^m < Q^c$ because it sets $MR$, not $P$, equal to $MC$; on each unit between the two, $P > MC$, so each missed unit costs the amount $P - MC$. The price gap on the units still sold only moves surplus from one side to the other. Compare deadweight loss in a taxed market (3.9): there too the loss is the surplus on trades that do not take place.`,
      caption: String.raw`The blue demand curve, the orange marginal cost and the purple $MR$ curve give the monopoly point (green) and the competitive point (gold). **Slide the marginal cost** and, for the constant-elasticity family, the elasticity. Red triangle: the deadweight loss; green rectangle: the surplus handed from consumers to the firm. Right: total surplus as a function of output; it peaks at $Q^c$ and the vertical gap to the monopoly output is the deadweight loss (the numbers are integrals computed from the curves).`,
      deps: ['micro-10.2', 'micro-3.9'],
      refs: ['Mankiw Ch. 15', 'Varian Ch. 25'], tags: ['monopoly', 'welfare'],
      credit: 'A. C. Harberger, Monopoly and Resource Allocation, American Economic Review (Papers and Proceedings) 44 (2): 77–87, 1954 (first large empirical estimate)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Deadweight_loss' },
      viz(v) {
        const kind = v.select('demand', [{ value: 'lin', label: 'linear' }, { value: 'iso', label: 'constant elasticity' }], 'lin');
        const cS = v.slider('marginal cost $c$', 0.5, 5, 2, { step: 0.05 });
        const eS = v.slider('$|\\varepsilon|$ (constant-elasticity case)', 1.4, 4, 2, { step: 0.05 });
        const s = mstage(v, { x: [0, 12], y: [0, 12], title: 'monopoly versus competition' });
        const W = v.stage({ x: [0, 12], y: [0, 40], axes: 'box', gutter: true, xlabel: 'output $Q$', ylabel: 'total surplus', height: 360, title: 'total surplus as output varies', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'demand'], ['purple', 'marginal revenue'], ['orange', 'marginal cost'], ['red', 'deadweight loss', { area: true }], ['green', 'transfer to the firm', { area: true }]]);
        let st = {};
        v.render(() => {
          const lin_ = kind.value === 'lin';
          eS.el.hidden = lin_;
          const D = lin_ ? lin(12, 1) : iso(8, eS.value), c = cS.value;
          const Qm = bisect((x) => D.MR(x) - c, 0.001, 400, 70), Qc = bisect((x) => D.P(x) - c, 0.001, 400, 70);
          const xm = lin_ ? 12 : Math.min(60, Qc * 1.15), ym = lin_ ? 12 : Math.min(30, D.P(Qm) * 1.5);
          s.setView([0, xm], [0, ym]);
          const pm = D.P(Qm), dwl = integ((x) => D.P(x) - c, Qm, Qc), tr = Qm * (pm - c), q0 = lin_ ? 0 : (8 / ym) ** eS.value;
          s.rect(0, c, Qm, pm, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.2 });
          s.between(D.P, () => c, Qm, Qc, { fill: 'red', fillAlpha: 0.4 });
          s.clip(() => {
            s.fn(D.P, { domain: [Math.max(q0, 0.05), xm], color: 'accent', width: 2.6 });
            s.fn(D.MR, { domain: [Math.max(q0, 0.05), xm], color: 'purple', width: 2.6 });
            s.hline(c, { color: 'orange', width: 2.4 });
          });
          s.dot(Qm, pm, { r: 7, color: 'green' }); s.dot(Qm, c, { r: 4, color: 'orange' }); s.dot(Qc, c, { r: 7, color: 'gold' });
          s.tex('Q^m', Qm, 0, { dy: -14, color: 'green' }); s.tex('Q^c', Qc, 0, { dy: -14, color: 'ink' });
          const Wf = (q) => integ((x) => D.P(x) - c, lin_ ? 0 : Math.max(q0, 0.02), q, 60);
          const Wc = Wf(Qc);
          W.setView([0, xm], [0, Wc * 1.2]);
          W.fn(Wf, { domain: [Math.max(q0, 0.05) + 0.01, xm], color: 'ink', width: 2.4 });
          W.vline(Qm, { color: 'green', width: 1.5, dash: [3, 3] }); W.vline(Qc, { color: 'gold', width: 1.5, dash: [3, 3] });
          W.dot(Qm, Wf(Qm), { r: 6, color: 'green' }); W.dot(Qc, Wc, { r: 6, color: 'gold' });
          W.line(0, Wc, xm, Wc, { color: 'muted', width: 1, dash: [3, 3] });
          st = { Qm, Qc, pm, dwl, tr, gap: Wc - Wf(Qm), c, lin: lin_ };
        });
        v.readout(() => `Monopoly: $Q^m = ${fx(st.Qm)}$, $P^m = ${fx(st.pm)}$. Competition: $Q^c = ${fx(st.Qc)}$, $P^c = ${fx(st.c)}$.\nTransfer $Q^m(P^m - MC) = ${fx(st.tr)}$ (a rectangle). Deadweight loss $\\int_{Q^m}^{Q^c}(P - MC)\\,dQ = ${fx(st.dwl)}$; the drop in total surplus on the right is $${fx(st.gap)}$.${st.lin ? ` Linear demand and constant cost: $\\tfrac12 (P^m - MC)(Q^c - Q^m) = ${fx(0.5 * (st.pm - st.c) * (st.Qc - st.Qm))}$.` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 10.5
    {
      num: '10.5', kind: 'Concept', name: 'First-degree price discrimination',
      statement: String.raw`A seller who knows each buyer's reservation price and can prevent resale practises **first-degree** (perfect) price discrimination: each unit is sold to the buyer who values it most at exactly that buyer's reservation price, as long as it exceeds marginal cost. Output is then the competitive one, $Q^c$ with $P(Q^c) = MC$, so there is **no deadweight loss**; but all the surplus, $\int_0^{Q^c}(P - MC)\,dQ$, goes to the seller and consumer surplus is zero. A single-price monopolist, by contrast, earns less and leaves a deadweight loss (10.4).`,
      idea: String.raw`Under a single price, every unit sold at $P^m$ earns the same marginal revenue $P^m - $ (price cut on the others), so the firm stops short. A discriminating seller does not have to cut the price on the earlier units: the price cut applies only to the new buyer, so $MR$ equals the new buyer's price and the demand curve becomes the marginal revenue curve. Setting $MR = MC$ then gives $P = MC$, the efficient output (10.2, 3.6). Efficiency survives, distribution changes completely: what the monopolist captures is the whole consumer surplus.`,
      caption: String.raw`Each bar is one buyer's reservation price (a staircase approximating the demand curve; more buyers with the slider makes it smoother). **Drag the single price** $p$: buyers whose bar reaches above the line buy. Uniform price: profit (green), unserved buyers whose value exceeds cost (red, the deadweight loss), consumer surplus (blue). **Switch to perfect discrimination**: everyone with value above cost buys at his or her own value, all the bar above the cost line is profit and the red and blue vanish.`,
      deps: ['micro-10.2', 'micro-3.6'],
      refs: ['Varian Ch. 26'], tags: ['price discrimination'],
      credit: 'A. C. Pigou, The Economics of Welfare, 1920 (the classification into first, second and third degree)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Price_discrimination' },
      viz(v) {
        const mode = v.select('pricing', [{ value: 'uni', label: 'one price' }, { value: 'pd', label: 'perfect discrimination' }], 'uni');
        const nS = v.slider('number of buyers', 5, 40, 12, { int: true });
        const pS = v.slider('single price $p$', 0, 10, 6, { step: 0.05 });
        const cS = v.slider('marginal cost $c$', 0, 6, 2, { step: 0.05 });
        const s = v.stage({ x: [0, 40], y: [0, 11], axes: 'box', gutter: true, xlabel: 'buyers, ordered by willingness to pay', ylabel: 'price / value', height: 380, title: 'one bar per buyer' });
        v.legend([['accent', 'consumer surplus', { area: true }], ['green', 'profit', { area: true }], ['red', 'lost surplus (not served)', { area: true }], ['orange', 'marginal cost'], ['ink', 'single price']]);
        let st = {};
        v.render(() => {
          const n = nS.value, c = cS.value, p = pS.value, pd = mode.value === 'pd';
          pS.el.hidden = pd;
          s.setView([0, n + 1], [0, 11]);
          // reservation values from the linear demand P = 10 − 10 q / N  (buyer i is worth 10 (1 − (i − 0.5)/n))
          let prof = 0, cs = 0, lost = 0, sold = 0;
          for (let i = 1; i <= n; i++) {
            const val = 10 * (1 - (i - 0.5) / (n + 0.5)), pay = pd ? val : p, serve = pd ? val > c : val >= p;
            if (serve) { prof += pay - c; cs += val - pay; sold++; } else if (val > c) lost += val - c;
            const col = serve ? 'accent' : 'red';
            s.rect(i - 0.4, 0, i + 0.4, val, { fill: col, fillAlpha: serve ? 0.25 : 0.2, color: col, width: 1 });
            if (serve) {
              if (pay >= c) s.rect(i - 0.4, c, i + 0.4, pay, { fill: 'green', fillAlpha: 0.55, stroke: false });
              else s.rect(i - 0.4, pay, i + 0.4, c, { fill: 'red', fillAlpha: 0.5, stroke: false });
            } else if (val > c) s.rect(i - 0.4, c, i + 0.4, val, { fill: 'red', fillAlpha: 0.4, stroke: false });
          }
          s.hline(c, { color: 'orange', width: 2.4 });
          if (!pd) s.hline(p, { color: 'ink', width: 2.2 });
          st = { prof, cs, lost, sold, n, pd, total: prof + cs };
        });
        v.readout(() => `${st.sold} of ${st.n} buyers served. Profit $${fx(st.prof)}$, consumer surplus $${fx(st.cs)}$, lost surplus (deadweight loss) $${fx(st.lost)}$; total surplus $${fx(st.total)}$ of the possible $${fx(st.total + st.lost)}$.${st.pd ? '\nPerfect discrimination: nothing is lost and the consumers keep nothing.' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 10.6
    {
      num: '10.6', kind: 'Concept', name: 'Second-degree price discrimination',
      statement: String.raw`When the seller cannot tell high-demand from low-demand buyers, it can offer a **menu of packages** $(Q_L, T_L)$ and $(Q_H, T_H)$ (quantity and total payment) so that each type picks its own. Buyer type $i$ with benefit $V_i(Q)$ gets net surplus $V_i(Q) - T$. The menu must satisfy two **participation** constraints (each type does at least as well as buying nothing) and two **self-selection** constraints (each type prefers its package to the other's). At the optimum the high type gets the efficient quantity, $V_H'(Q_H) = c$; the low type is held to zero surplus and gets an **inefficiently small** package, $V_L'(Q_L) < c$, to make it less attractive to the high type.`,
      idea: String.raw`The binding constraints are the low type's participation and the high type's temptation to take the low package. Since the high type values quantity more, handing it a rent $(\theta_H - \theta_L)Q_L$ for pretending to be low is unavoidable, and the rent grows with $Q_L$. Trimming $Q_L$ below the efficient size loses a little surplus on the low type (second-order, as marginal benefit equals cost at the efficient size) but cuts the rent given to the high type (first-order). With benefit $V_i(Q) = \theta_i Q - Q^2/2$ and a share $\varphi$ of high types, $Q_H = \theta_H - c$ and $Q_L = \theta_L - c - \tfrac{\varphi}{1-\varphi}(\theta_H - \theta_L)$.`,
      caption: String.raw`The curves are the two types' **willingness to pay** $V_L(Q)$ (orange) and $V_H(Q)$ (blue) in the plane of quantity and total payment; a package is a point, and each type prefers points below its own curve and closer to it. **Drag the two packages.** The readout ticks or crosses each of the four constraints; profit counts $\varphi$ high and $1-\varphi$ low buyers at unit cost $c$. The hollow dots mark the optimal menu; press **optimal menu** to move the packages there: $Q_H$ is efficient, $Q_L$ is cut below the efficient size (dashed) and both payments sit on the constraints.`,
      deps: ['micro-10.5'],
      refs: ['Varian Ch. 26'], tags: ['price discrimination', 'information'],
      credit: 'M. Mussa & S. Rosen, Monopoly and Product Quality, Journal of Economic Theory 18 (2): 301–317, 1978; E. Maskin & J. Riley, Monopoly with Incomplete Information, RAND Journal of Economics 15 (2): 171–196, 1984',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Price_discrimination#Second-degree_price_discrimination' },
      viz(v) {
        const pS = v.slider('share of high type $\\varphi$', 0.1, 0.8, 0.3, { step: 0.01 });
        const tS = v.slider('low type $\\theta_L$', 3, 8, 6, { step: 0.05 });
        const TH = 10, c = 2;
        const s = v.stage({ x: [0, 10.5], y: [0, 52], axes: 'box', gutter: true, xlabel: 'quantity in the package $Q$', ylabel: 'total payment $T$', height: 400, title: 'menu of two packages' });
        v.legend([['orange', 'low type: $V_L(Q)$'], ['accent', 'high type: $V_H(Q)$'], ['gold', 'low package', { dot: true }], ['green', 'high package', { dot: true }]]);
        const HL = s.handle(3, 12, { color: 'gold', r: 9, label: 'L', labelPos: 'se' });
        const HH = s.handle(6, 30, { color: 'green', r: 9, label: 'H', labelPos: 'nw' });
        let st = {};
        const V = (th) => (q) => th * q - (q * q) / 2;
        const opt = () => { const phi = pS.value, th = tS.value, qH = TH - c, qL = Math.max(0, th - c - (phi / (1 - phi)) * (TH - th)); return { qH, qL, TL: V(th)(qL), TH: V(TH)(qH) - (TH - th) * qL }; };
        const prof = (qL, tL, qH, tH) => (1 - pS.value) * (tL - c * qL) + pS.value * (tH - c * qH);
        v.button('optimal menu', () => { const o = opt(); HL.set(o.qL, o.TL); HH.set(o.qH, o.TH); });
        v.render(() => {
          const th = tS.value, VL = V(th), VH = V(TH), qL = HL.x, tL = HL.y, qH = HH.x, tH = HH.y;
          const o = opt();
          s.fn(VL, { domain: [0, 10.5], color: 'orange', width: 2.4 }); s.fn(VH, { domain: [0, 10.5], color: 'accent', width: 2.4 });
          s.fn((q) => c * q, { domain: [0, 10.5], color: 'muted', width: 1.5, dash: [3, 3] });
          s.vline(th - c, { color: 'orange', width: 1, dash: [3, 3] });
          tag(s, 'cost line $T = cQ$', 10.4, 2 * 10.4 - 5, 'muted', { align: 'right' });
          const sL = VL(qL) - tL, sH = VH(qH) - tH;
          const okIRL = sL >= -0.05, okIRH = sH >= -0.05, okICL = sL >= VL(qH) - tH - 0.05, okICH = sH >= VH(qL) - tL - 0.05;
          s.dot(o.qL, o.TL, { r: 5, hollow: true, color: 'orange' }); s.dot(o.qH, o.TH, { r: 5, hollow: true, color: 'accent' });
          st = { okIRL, okIRH, okICL, okICH, p: prof(qL, tL, qH, tH), po: prof(o.qL, o.TL, o.qH, o.TH), o, qL, qH };
        });
        const m = (ok, t) => `${ok ? '✓' : '✗'} ${t}`;
        v.readout(() => `Constraints: ${m(st.okIRL, 'low participates')}, ${m(st.okIRH, 'high participates')}, ${m(st.okICL, 'low prefers L')}, ${m(st.okICH, 'high prefers H')}.\nProfit of your menu $${fx(st.p)}$ (it is only meaningful when all four hold); optimal menu $Q_H = ${fx(st.o.qH)}$ (efficient), $Q_L = ${fx(st.o.qL)}$ versus efficient $${fx(tS.value - 2)}$, profit $${fx(st.po)}$.`);
      },
    },
  ],
};
