// Microeconomics — Chapter 10: Market power: monopoly and oligopoly — items 10.7–10.12
import { clamp, GUIDE, fx, bisect, argmax, plateText, bar, lin, iso, mstage, tag, integ, tween, polyArea } from './ch10.shared.js';

export default {
  collection: 'micro',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.7
    {
      num: '10.7', kind: 'Concept', name: 'Third-degree price discrimination',
      statement: String.raw`A monopolist that can identify two groups of buyers (students and adults, domestic and foreign) and prevent resale charges each group its own price. With marginal cost $MC(Q)$ for total output $Q = q_1 + q_2$, profit is maximized when **marginal revenue is equal in the two markets and equal to marginal cost**,
$$MR_1(q_1) = MR_2(q_2) = MC(q_1 + q_2),$$
so by the inverse-elasticity rule (10.3) the group with the **less elastic** demand pays the **higher** price: $P_i\,(1 - 1/|\varepsilon_i|) = MC$ for both. Compared with the best single price the firm's profit is never lower; total output can go up or down, and for linear demands it is the same.`,
      idea: String.raw`If $MR_1 > MR_2$, shifting a unit of sales from market 2 to market 1 raises revenue at no change in cost, so at an optimum the two marginal revenues are equal, and equal to $MC$ of the total. The elasticity rule (10.3) applied to each market then makes the prices differ exactly when the elasticities do. A single price is one feasible policy of the discriminating firm (set $P_1 = P_2$), so it cannot do better. For linear demands the two markets' quantities move in opposite directions and cancel in the total; welfare falls with discrimination when total output does not rise, since the same output is split inefficiently between buyers who value it differently.`,
      caption: String.raw`Market 1 (left) has demand $P = 16 - q_1$, market 2 (right) has intercept and slope you choose; the horizontal line is the common marginal cost level at the optimum (separate prices) or the single price. **Change the steepness of market 2** and see its price move away from market 1's whenever the elasticities at the optimum differ. The **one price** toggle replaces the two prices by the best uniform one: compare profit, output, and total surplus in the readout.`,
      deps: ['micro-10.3'],
      refs: ['Varian Ch. 26', 'Mankiw Ch. 15'], tags: ['price discrimination'],
      credit: 'A. C. Pigou, The Economics of Welfare, 1920 (the classification into first, second and third degree)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Price_discrimination#Third-degree_price_discrimination' },
      viz(v) {
        const mode = v.select('pricing', [{ value: 'disc', label: 'separate prices' }, { value: 'uni', label: 'one price' }], 'disc');
        const a2 = v.slider('market 2 intercept $a_2$', 8, 20, 12, { step: 0.1 });
        const b2 = v.slider('market 2 slope $b_2$', 0.5, 3, 1.5, { step: 0.05 });
        const cS = v.slider('marginal cost $c$', 0, 6, 2, { step: 0.05 });
        const mS = v.slider('rise of marginal cost $m$', 0, 0.5, 0.1, { step: 0.01 });
        const S1 = mstage(v, { x: [0, 16], y: [0, 20], title: 'market 1: $P = 16 - q_1$', weight: 1 });
        const S2 = mstage(v, { x: [0, 16], y: [0, 20], title: 'market 2', weight: 1 });
        v.legend([['accent', 'demand'], ['purple', 'marginal revenue'], ['orange', 'common level of $MR$ = $MC$ (or the single price)'], ['green', 'consumer surplus', { area: true }], ['gold', 'chosen point', { dot: true }]]);
        let st = {};
        v.render(() => {
          const M = [lin(16, 1), lin(a2.value, b2.value)], c = cS.value, m = mS.value;
          const C = (Q) => c * Q + (m * Q * Q) / 2;
          const qOf = (lam) => M.map((d) => Math.max(0, (d.a - lam) / (2 * d.b)));
          const lam = bisect((l) => c + m * qOf(l).reduce((x, y) => x + y, 0) - l, 0, 25, 70) ?? c;
          const qd = qOf(lam), pd = qd.map((q, i) => M[i].P(q));
          const profU = (p) => { const Q = M.reduce((s_, d) => s_ + d.D(p), 0); return p * Q - C(Q); };
          const pu = argmax(profU, 0, 20, 100).x, qu = M.map((d) => d.D(pu));
          const uni = mode.value === 'uni';
          const q = uni ? qu : qd, p = uni ? [pu, pu] : pd;
          [S1, S2].forEach((S, i) => {
            const d = M[i];
            S.poly([[0, d.a], [q[i], p[i]], [0, p[i]]], { fill: 'green', fillAlpha: 0.22, stroke: false });
            S.fn(d.P, { domain: [0, d.a / d.b], color: 'accent', width: 2.6 });
            S.fn(d.MR, { domain: [0, d.a / (2 * d.b)], color: 'purple', width: 2.4 });
            if (!uni) S.hline(lam, { color: 'orange', width: 2.2 });
            S.hline(p[i], { color: uni ? 'orange' : 'muted', width: uni ? 2.4 : 1, dash: uni ? false : [3, 3] });
            S.vline(q[i], { color: 'muted', width: 1, dash: [3, 3] });
            S.dot(q[i], p[i], { r: 7, color: 'gold' });
            tag(S, `$P = ${fx(p[i])}$`, 15.6, p[i], 'ink', { align: 'right', dy: -12 });
          });
          S2.setTitle(`market 2: $P = ${fx(a2.value, 1)} - ${fx(b2.value, 2)}\\,q_2$`);
          const Q = q[0] + q[1], profit = p[0] * q[0] + p[1] * q[1] - C(Q), cs = M.reduce((s_, d, i) => s_ + 0.5 * q[i] * (d.a - p[i]), 0);
          const eps = q.map((qi, i) => (qi > 0 ? M[i].eps(qi) : NaN));
          const Qu = qu[0] + qu[1], profitU = pu * Qu - C(Qu), csU = M.reduce((s_, d, i) => s_ + 0.5 * qu[i] * (d.a - pu), 0);
          const Qd = qd[0] + qd[1], profitD = pd[0] * qd[0] + pd[1] * qd[1] - C(Qd), csD = M.reduce((s_, d, i) => s_ + 0.5 * qd[i] * (d.a - pd[i]), 0);
          st = { q, p, Q, profit, cs, eps, lam, MR: [M[0].MR(q[0]), M[1].MR(q[1])], mc: c + m * Q, uni, profitU, profitD, wU: profitU + csU, wD: profitD + csD, Qu, Qd };
        });
        v.readout(() => `Prices $${fx(st.p[0])}$ and $${fx(st.p[1])}$, elasticities $|\\varepsilon_1| = ${fx(-st.eps[0], 2)}$, $|\\varepsilon_2| = ${fx(-st.eps[1], 2)}$ (the higher price is in the less elastic market). $MR_1 = ${fx(st.MR[0])}$, $MR_2 = ${fx(st.MR[1])}$, $MC = ${fx(st.mc)}$.\nSeparate prices: profit $${fx(st.profitD)}$, output $${fx(st.Qd)}$, total surplus $${fx(st.wD)}$. One price: profit $${fx(st.profitU)}$, output $${fx(st.Qu)}$, total surplus $${fx(st.wU)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.8
    {
      num: '10.8', kind: 'Concept', name: 'Natural monopoly and its regulation',
      statement: String.raw`A **natural monopoly** is a market in which one firm can supply the whole demand at lower total cost than two or more, which happens when average cost is still falling at the quantity demanded (a large fixed cost relative to marginal cost, 7.14: subadditive costs). An unregulated monopolist charges the monopoly price (10.2) and leaves a deadweight loss (10.4). **Marginal-cost pricing** is efficient, but with $AC > MC$ it loses money, so the firm needs a subsidy. **Average-cost pricing** ($P = AC$) lets the firm break even and gets most, but not all, of the efficiency; the deadweight loss is smaller than under monopoly and larger than at $P = MC$.`,
      idea: String.raw`With cost $C(Q) = F + cQ$ the average cost $F/Q + c$ falls and stays above the constant marginal cost $c$, so one plant is cheapest; $n$ identical plants would pay $nF$ instead of $F$ for the same output. Regulation faces a trade-off between efficiency and the budget: pricing at $MC$ puts a loss $F$ on the firm; pricing at $AC$ is where the demand curve meets the average-cost curve, so the firm just breaks even (the larger of the two crossings, if any; a market too small to cover $F$ at any price cannot be served without subsidy). Welfare is measured as in 10.4, deadweight loss against the efficient output where $P = MC$.`,
      caption: String.raw`Demand is $P = 20 - Q$ and the cost is $C = F + 2Q$. **Slide the fixed cost $F$** and **choose the regulation**: no regulation (monopoly), price equal to marginal cost (loss $F$ to be subsidized), or price equal to average cost (break-even). The red triangle is the deadweight loss relative to $P = MC$. The bars on the right show the cost of producing the market's output with one, two, ... firms (**$n$ slider**): each extra firm adds a fixed cost $F$ with nothing gained. With a large $F$ the average-cost curve no longer touches the demand curve: the market cannot be served without subsidy.`,
      deps: ['micro-7.14', 'micro-10.4'],
      refs: ['Varian Ch. 25', 'Mankiw Ch. 15'], tags: ['monopoly', 'regulation'],
      credit: 'H. Hotelling, The General Welfare in Relation to Problems of Taxation and of Railway and Utility Rates, Econometrica 6 (3): 242–269, 1938 (marginal-cost pricing and the subsidy question)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Natural_monopoly' },
      viz(v) {
        const reg = v.select('regulation', [{ value: 'none', label: 'none' }, { value: 'mc', label: '$P = MC$' }, { value: 'ac', label: '$P = AC$' }], 'none');
        const fS = v.slider('fixed cost $F$', 5, 90, 30, { step: 1 });
        const nS = v.slider('firms $n$ splitting the output', 1, 5, 2, { int: true });
        const a = 20, b = 1, c = 2, D = lin(a, b);
        const s = mstage(v, { x: [0, 20], y: [0, 22], title: 'demand and costs' });
        const K = v.stage({ x: [0.4, 5.6], y: [0, 100], axes: 'box', gutter: true, xlabel: 'number of firms $n$', ylabel: 'total cost of the output', height: 360, title: 'splitting the market', weight: 0.7, minWidth: 240 });
        v.legend([['accent', 'demand'], ['purple', 'marginal revenue'], ['orange', 'marginal cost'], ['teal', 'average cost'], ['red', 'deadweight loss', { area: true }], ['gold', 'outcome', { dot: true }]]);
        let st = {};
        v.render(() => {
          const F = fS.value, AC = (q) => F / q + c, Qc = (a - c) / b;
          const Qm = bisect((x) => D.MR(x) - c, 0, 20, 60), Pm = D.P(Qm);
          // average-cost pricing: larger root of P(Q) = AC(Q)
          let Qa = null; { const g = (q) => D.P(q) - AC(q); const am = argmax(g, 0.05, 19.9, 200); if (am.f >= 0) Qa = bisect(g, am.x, 19.9, 60); }
          const Q = reg.value === 'none' ? Qm : reg.value === 'mc' ? Qc : Qa;
          const ok = Q !== null && Q > 0;
          s.fn(D.P, { domain: [0, 20], color: 'accent', width: 2.6 });
          s.fn(D.MR, { domain: [0, 10], color: 'purple', width: 2.4 });
          s.hline(c, { color: 'orange', width: 2.4 });
          s.fn(AC, { domain: [0.9, 20], color: 'teal', width: 2.6 });
          tag(s, 'AC', 1.5, AC(1.5) - 0.5, 'teal', { align: 'left' }); tag(s, 'MC', 19.6, c, 'orange', { align: 'right', dy: 12 });
          if (ok) {
            const P = D.P(Q);
            if (Q < Qc) s.between(D.P, () => c, Q, Qc, { fill: 'red', fillAlpha: 0.4 });
            s.vline(Q, { color: 'muted', width: 1, dash: [3, 3] }); s.hline(P, { color: 'muted', width: 1, dash: [3, 3] });
            s.dot(Q, P, { r: 8, color: 'gold' });
            const profit = Q * (P - c) - F, dwl = Q < Qc ? integ((x) => D.P(x) - c, Q, Qc) : 0;
            st = { ok, Q, P, profit, dwl, Qc, Qm, Pm, Qa, F, AC: AC(Q) };
            K.setView([0.4, 5.6], [0, 5 * F + c * Q * 1.1 + 5]);
            for (let n = 1; n <= 5; n++) bar(K, n, 0.6, 0, n * F + c * Q, n === nS.value ? 'red' : 'accent', { fillAlpha: n === nS.value ? 0.6 : 0.25 });
            K.text(`$${fx(F + c * Q, 0)}$`, 1, F + c * Q, { dy: -12, size: 12 });
          } else { st = { ok: false, F, Qm, Pm }; plateText(s, 'average cost never meets demand', 10, 12, { color: 'red', align: 'center' }); }
        });
        v.readout(() => !st.ok ? `With fixed cost $${st.F}$ no price covers cost: the largest possible profit at any price is $${fx(0.25 * (a - c) ** 2 - st.F)}$ at $Q = ${fx((a - c) / 2)}$ — the market cannot be served without a subsidy of at least $${fx(st.F - 0.25 * (a - c) ** 2)}$.` : `Price $${fx(st.P)}$, output $${fx(st.Q)}$ (efficient $${fx(st.Qc)}$). Profit $${fx(st.profit)}$${st.profit < -0.005 ? ' (a loss: the subsidy needed)' : ''}. Deadweight loss $${fx(st.dwl)}$; unregulated monopoly would be $Q = ${fx(st.Qm)}$ at $P = ${fx(st.Pm)}$.\nWith $${nS.value}$ firms the same output costs $${fx(nS.value * st.F + 2 * st.Q, 0)}$ against $${fx(st.F + 2 * st.Q, 0)}$ for one.`);
      },
    },
    // ------------------------------------------------------------------ 10.9
    {
      num: '10.9', kind: 'Model', name: 'Monopolistic competition',
      statement: String.raw`In **monopolistic competition** many firms sell differentiated products and each faces a downward-sloping demand curve, so each prices above marginal cost, but entry is free. Entry shifts every firm's demand curve inward until profit is zero: the demand curve is **tangent to average cost** at the firm's chosen output. In that long-run equilibrium (i) $P > MC$: a markup remains and the outcome is not efficient in the price-equals-marginal-cost sense; (ii) $P = AC$: profit is zero; and (iii) output is **below** the minimum-efficient scale where $AC$ is lowest (**excess capacity**), because the tangency is on the falling part of $AC$.`,
      idea: String.raw`Each firm is a monopolist on its own demand curve (10.2), so it produces where $MR = MC$ and earns profit $(P - AC)Q$ there. A positive profit invites entry of new varieties, which draws customers away and shifts each firm's demand curve in; a loss drives exit. The process stops when the best the firm can do is break even (zero long-run profit, 8.8). Since the demand curve is downward sloping it can touch $AC$ only where $AC$ is also falling, hence the tangency to the left of the minimum. Whether the variety gained is worth the markup and the excess capacity is a further question.`,
      caption: String.raw`Each firm's demand is $P = c + (A - c)/n - bQ$ (an illustrative parametrization: more varieties $n$ shift demand inward), with a U-shaped average cost. **Slide $n$** or press **let firms enter**: the blue demand curve falls until it just touches the teal average-cost curve (the green profit rectangle shrinks to nothing). At the end output (gold) is smaller than the output at minimum $AC$ (grey marker): the gap is the excess capacity, and the price stays above $MC$. Right: profit as a function of $n$.`,
      deps: ['micro-10.2', 'micro-8.8'],
      refs: ['Mankiw Ch. 16', 'Varian Ch. 26'], tags: ['competition', 'entry'],
      credit: 'E. H. Chamberlin, The Theory of Monopolistic Competition, 1933; J. Robinson, The Economics of Imperfect Competition, 1933',
      verify: true,
      scope: String.raw`A stylized Chamberlinian "large group" model with symmetric firms; the way demand shrinks with $n$ is assumed, not derived from preferences (see Dixit–Stiglitz-type models for that).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Monopolistic_competition' },
      viz(v) {
        const nS = v.slider('number of varieties $n$', 1, 8, 1, { step: 0.01 });
        const A = 42, c = 2, b = 1, m = 0.5, F = 16;
        const s = mstage(v, { x: [0, 14], y: [0, 44], title: 'one firm\'s demand as rivals enter', height: 380 });
        const G = v.stage({ x: [1, 8], y: [-60, 130], axes: 'box', gutter: true, xlabel: 'number of varieties $n$', ylabel: 'profit per firm', height: 380, title: 'profit and entry', weight: 0.7, minWidth: 240 });
        v.legend([['accent', 'demand'], ['purple', 'marginal revenue'], ['orange', 'marginal cost'], ['teal', 'average cost'], ['green', 'profit', { area: true }], ['gold', 'output', { dot: true }]]);
        const aOf = (n) => c + (A - c) / n;
        const best = (n) => { const a = aOf(n), q = (a - c) / (2 * b + m), pi = (a - c) * q - (b + m / 2) * q * q - F; return { q, pi, p: a - b * q }; };
        const nStar = bisect((n) => best(n).pi, 1, 12, 60) ?? 1;
        let stop = () => {};
        v.button('let firms enter', () => { stop(); const n0 = nS.value; stop = tween(v, 3200, (u) => nS.set(n0 + (nStar - n0) * (1 - (1 - u) ** 2))); });
        let st = {};
        v.render(() => {
          const n = nS.value, a = aOf(n), AC = (q) => F / q + c + (m * q) / 2, MC = (q) => c + m * q, o = best(n), qmin = Math.sqrt((2 * F) / m);
          s.fn((q) => aOf(1) - b * q, { domain: [0, 14], color: 'accent', width: 1.4, alpha: 0.3, dash: true });
          s.fn(AC, { domain: [1.2, 14], color: 'teal', width: 2.6 });
          s.fn(MC, { domain: [0, 14], color: 'orange', width: 2.4 });
          s.rect(0, Math.min(o.p, AC(o.q)), o.q, Math.max(o.p, AC(o.q)), { fill: o.pi >= 0 ? 'green' : 'red', fillAlpha: 0.3, color: o.pi >= 0 ? 'green' : 'red', width: 1.2 });
          s.fn((q) => a - b * q, { domain: [0, Math.min(14, a / b)], color: 'accent', width: 2.8 });
          s.fn((q) => a - 2 * b * q, { domain: [0, Math.min(14, a / (2 * b))], color: 'purple', width: 2.4 });
          s.vline(qmin, { color: 'muted', width: 1, dash: [3, 3] }); s.dot(qmin, AC(qmin), { r: 5, color: 'muted' });
          tag(s, 'min AC', qmin, AC(qmin), 'muted', { dy: 16 });
          s.dot(o.q, o.p, { r: 8, color: 'gold' });
          if (o.q < qmin) s.measure(o.q, 1.5, qmin, 1.5, 'excess capacity');
          const prof = (x) => best(x).pi;
          G.fn(prof, { domain: [1, 8], color: 'ink', width: 2.4 }); G.hline(0, { color: 'muted', width: 1 });
          G.dot(n, o.pi, { r: 7, color: 'gold' }); G.dot(nStar, 0, { r: 6, color: 'green' });
          tag(G, 'zero profit', nStar, 0, 'green', { dy: -16 });
          st = { n, o, qmin, ac: AC(o.q), mc: MC(o.q) };
        });
        v.readout(() => `$n = ${fx(st.n)}$: output $${fx(st.o.q)}$, price $${fx(st.o.p)}$, average cost $${fx(st.ac)}$, profit per firm $${fx(st.o.pi)}$. Free entry stops at $n^* = ${fx(nStar, 3)}$ (profit zero).\nMarkup $(P - MC)/P = ${fx((st.o.p - st.mc) / st.o.p, 3)}$. Output at minimum $AC$ is $${fx(st.qmin)}$, so the gap (excess capacity) is $${fx(Math.max(0, st.qmin - st.o.q))}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.10
    {
      num: '10.10', kind: 'Model', name: 'Cournot duopoly',
      statement: String.raw`Two firms choose quantities $q_1, q_2$ simultaneously; the market price is $P(q_1 + q_2)$ and firm $i$ earns $\pi_i = q_i P(q_1 + q_2) - C_i(q_i)$. A **Cournot–Nash equilibrium** is a pair $(q_1^*, q_2^*)$ in which each quantity is a best reply to the other: $q_i^* = R_i(q_j^*)$, where $R_i(q_j)$ maximizes $\pi_i$ for given $q_j$. With inverse demand $P = a - bQ$ and constant marginal costs $c_i$,
$$R_i(q_j) = \frac{a - c_i - b\,q_j}{2b}, \qquad q_1^* = \frac{a - 2c_1 + c_2}{3b},\quad q_2^* = \frac{a - 2c_2 + c_1}{3b}.$$
Reaction curves slope downward (quantities are strategic substitutes), and the equilibrium output is above the monopoly output and below the competitive one.`,
      idea: String.raw`Given $q_j$, firm $i$ faces the **residual demand** $a - b q_j - b q_i$, whose intercept falls with the rival's output, and is a monopolist on it (10.2): $MR_i = a - b q_j - 2b q_i = c_i$, which is the reaction function. A rival that sells more leaves less room, so the best response falls. The equilibrium is where the two reaction lines cross, and no firm gains by changing its quantity alone (the best reply condition of a Nash equilibrium, game-1.3). Each firm produces more than half of the monopoly output because it ignores the effect of its output on the rival's profit (the price externality).`,
      caption: String.raw`The plane of outputs $(q_1, q_2)$. **Drag the gold point**: the arrows show each firm's best reply to the other's current output (firm 1 moves horizontally to its blue line, firm 2 vertically to its orange line). The closed curves are firm 1's **iso-profit** curve through the point and through the equilibrium (profit rises as $q_2$ falls). The green dot where the reaction lines cross is the equilibrium. Change the costs $c_1, c_2$: the line of the firm with the lower cost shifts outward and it gets a larger share. Right: profits at your point and at the equilibrium.`,
      deps: ['micro-10.2'],
      see: ['game-1.3'],
      refs: ['Varian Ch. 28'], tags: ['oligopoly'],
      credit: 'A. A. Cournot, Recherches sur les principes mathématiques de la théorie des richesses, 1838 (chapter 7); the Nash-equilibrium reading is later',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cournot_competition' },
      viz(v) {
        const c1S = v.slider('cost $c_1$', 0, 5, 2, { step: 0.05 });
        const c2S = v.slider('cost $c_2$', 0, 5, 2, { step: 0.05 });
        const a = 12, b = 1;
        const s = v.stage({ x: [0, 12], y: [0, 12], axes: 'box', gutter: true, equal: true, xlabel: 'output of firm 1, $q_1$', ylabel: 'output of firm 2, $q_2$', height: 420, title: 'reaction curves in the output plane' });
        const B = v.stage({ x: [0.4, 4.6], y: [0, 24], axes: 'box', gutter: true, xticks: [[1, 'firm 1'], [2, 'eq. 1'], [3, 'firm 2'], [4, 'eq. 2']], ylabel: 'profit', height: 420, title: 'profits', weight: 0.6, minWidth: 230 });
        v.legend([['accent', 'firm 1 reaction line $R_1$'], ['orange', 'firm 2 reaction line $R_2$'], ['purple', 'iso-profit curves of firm 1'], ['green', 'Cournot equilibrium', { dot: true }], ['gold', 'test point', { dot: true }]]);
        const H = s.handle(9, 2, { color: 'gold', r: 9, label: '(q₁, q₂)', labelPos: 'ne', constrain: { x: [0.05, 11.9], y: [0.05, 11.9] } });
        let st = {};
        v.render(() => {
          const c1 = c1S.value, c2 = c2S.value, R1 = (q2) => Math.max(0, (a - c1 - b * q2) / (2 * b)), R2 = (q1) => Math.max(0, (a - c2 - b * q1) / (2 * b));
          const [e1, e2] = v.M.solve([[2 * b, b], [b, 2 * b]], [a - c1, a - c2]);
          const pi1 = (q1, q2) => q1 * (a - b * (q1 + q2) - c1), pi2 = (q1, q2) => q2 * (a - b * (q1 + q2) - c2);
          const q1 = H.x, q2 = H.y;
          s.clip(() => s.contour((x, y) => pi1(x, y), [pi1(q1, q2), pi1(e1, e2)], { color: 'purple', width: 1.8, res: 100 }));
          s.line(R1(0), 0, R1(12), 12, { color: 'accent', width: 2.6 }); s.line(0, R2(0), 12, R2(12), { color: 'orange', width: 2.6 });
          s.arrow(q1, q2, R1(q2), q2, { color: 'accent', width: 2 }); s.arrow(q1, q2, q1, R2(q1), { color: 'orange', width: 2 });
          s.dot(e1, e2, { r: 8, color: 'green' });
          tag(s, 'R₁', R1(11), 11, 'accent', { dx: 14 }); tag(s, 'R₂', 11.3, R2(11.3), 'orange', { dy: -14 });
          B.hline(0, { color: 'muted' });
          bar(B, 1, 0.5, 0, pi1(q1, q2), 'accent'); bar(B, 2, 0.5, 0, pi1(e1, e2), 'green'); bar(B, 3, 0.5, 0, pi2(q1, q2), 'orange'); bar(B, 4, 0.5, 0, pi2(e1, e2), 'green');
          st = { e1, e2, p1: pi1(q1, q2), p2: pi2(q1, q2), n1: pi1(e1, e2), n2: pi2(e1, e2), P: a - b * (e1 + e2), q1, q2, qm: (a - Math.min(c1, c2)) / (2 * b) };
        });
        v.readout(() => `Equilibrium $(${fx(st.e1)}, ${fx(st.e2)})$: total $${fx(st.e1 + st.e2)}$, price $${fx(st.P)}$, profits $${fx(st.n1)}$ and $${fx(st.n2)}$. A monopolist would produce $${fx(st.qm)}$.\nAt your point profits are $${fx(st.p1)}$ and $${fx(st.p2)}$; closed forms $(a - 2c_1 + c_2)/3b = ${fx((a - 2 * c1S.value + c2S.value) / (3 * b), 3)}$ and $${fx((a - 2 * c2S.value + c1S.value) / (3 * b), 3)}$ agree.`);
      },
    },
    // ------------------------------------------------------------------ 10.11
    {
      num: '10.11', kind: 'Proposition', name: 'Cournot with many firms approaches competition',
      statement: String.raw`With $n$ identical firms with marginal cost $c$ choosing quantities simultaneously, the symmetric Cournot equilibrium has each firm's markup tied to its market share and the elasticity of demand,
$$\frac{P - c}{P} = \frac{1}{n\,|\varepsilon|},$$
where $\varepsilon$ is the market demand elasticity at the equilibrium. As $n \to \infty$ the markup tends to zero, the price tends to $c$ and the total output tends to the competitive output, so the deadweight loss vanishes. For $n = 1$ the formula is the monopoly Lerner rule (10.3); for $P = a - bQ$, $c < a$, price is $\dfrac{a + nc}{n+1}$ and total output $\dfrac{n(a-c)}{(n+1)b}$.`,
      idea: String.raw`Firm $i$ maximizes $q_i P(Q) - c q_i$; the first-order condition is $P + q_i P'(Q) = c$, and with $q_i = Q/n$ and $P' = P/(\varepsilon Q)$ this reads $P(1 + \tfrac1{n\varepsilon}) = c$, i.e. 10.3 with the elasticity multiplied by $n$. A firm with a small share barely moves the price with its own output, so the price-reducing effect that makes a monopolist restrict output shrinks like $1/n$, and the firm behaves more and more like a price taker. Cournot himself described exactly this limit (his chapter 8); see 10.22.`,
      caption: String.raw`Slide the **number of firms** from 1 to 50 and switch between linear and constant-elasticity demand. Left: the equilibrium price (found by solving each firm's first-order condition numerically) falls from the monopoly price to marginal cost; the dots mark the chosen $n$. Right: the demand diagram with the output actually produced and the red deadweight-loss triangle, which shrinks as $n$ grows. The readout checks the markup against $1/(n|\varepsilon|)$.`,
      deps: ['micro-10.10', 'micro-10.3'],
      refs: ['Varian Ch. 28'], tags: ['oligopoly', 'competition'],
      credit: 'A. A. Cournot, Recherches sur les principes mathématiques de la théorie des richesses, 1838 (chapter 8, "unlimited competition")',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cournot_competition#Many_firms_and_the_limit' },
      viz(v) {
        const kind = v.select('demand', [{ value: 'lin', label: 'linear' }, { value: 'iso', label: 'constant elasticity ($|\\varepsilon| = 2$)' }], 'lin');
        const nS = v.slider('number of firms $n$', 1, 50, 3, { int: true });
        const cS = v.slider('marginal cost $c$', 0.5, 4, 2, { step: 0.05 });
        const L = v.stage({ x: [1, 50], y: [0, 10], axes: 'box', gutter: true, xlabel: 'number of firms $n$', ylabel: 'price', height: 380, title: 'price against the number of firms' });
        const S = mstage(v, { x: [0, 12], y: [0, 12], title: 'the market at this $n$', weight: 1, height: 380 });
        v.legend([['ink', 'Cournot price'], ['orange', 'marginal cost'], ['muted', 'monopoly price'], ['red', 'deadweight loss', { area: true }], ['gold', 'this $n$', { dot: true }]]);
        const eqQ = (D, c, n) => { const f = (Q) => D.P(Q) + (Q / n) * D.dP(Q) - c; return bisect(f, 1e-4, 200, 80); };
        let st = {};
        v.render(() => {
          const lin_ = kind.value === 'lin', c = cS.value, D = lin_ ? lin(12, 1) : iso(10, 2), n = nS.value;
          const Qn = eqQ(D, c, n), pn = D.P(Qn), Qc = bisect((x) => D.P(x) - c, 1e-4, 400, 80), Q1 = eqQ(D, c, 1);
          const dwl = integ((x) => D.P(x) - c, Qn, Qc);
          const pf = (k) => D.P(eqQ(D, c, k));
          L.fn((k) => pf(Math.max(1, k)), { domain: [1, 50], color: 'ink', width: 2.6, n: 60 });
          L.hline(c, { color: 'orange', width: 2.2 }); L.hline(D.P(Q1), { color: 'muted', width: 1.4, dash: [4, 3] });
          L.dot(n, pn, { r: 7, color: 'gold' });
          const xm = lin_ ? 12 : Math.min(40, Qc * 1.1);
          S.setView([0, xm], [0, 12]);
          const q0 = lin_ ? 0 : (10 / 12) ** 2;
          S.between(D.P, () => c, Qn, Qc, { fill: 'red', fillAlpha: 0.4 });
          S.clip(() => S.fn(D.P, { domain: [Math.max(0.05, q0), xm], color: 'accent', width: 2.6 }));
          S.hline(c, { color: 'orange', width: 2.2 }); S.vline(Qn, { color: 'muted', width: 1, dash: [3, 3] });
          S.dot(Qn, pn, { r: 7, color: 'gold' });
          st = { Qn, pn, Qc, dwl, eps: Math.abs(D.eps(Qn)), n, c };
        });
        v.readout(() => `$n = ${st.n}$: total output $${fx(st.Qn)}$ of the competitive $${fx(st.Qc)}$, price $${fx(st.pn)}$ (cost $${fx(st.c)}$).\nMarkup $(P - c)/P = ${fx((st.pn - st.c) / st.pn, 4)}$; $1/(n|\\varepsilon|) = ${fx(1 / (st.n * st.eps), 4)}$ with $|\\varepsilon| = ${fx(st.eps, 3)}$. Deadweight loss $${fx(st.dwl)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.12
    {
      num: '10.12', kind: 'Proposition', name: 'Stability of Cournot adjustment',
      statement: String.raw`Suppose firms adjust quantities by **best replies** to what the others produced last: $q_i^{t+1} = R_i(q_{-i}^{\,t})$. With linear demand $P = a - bQ$ and equal constant costs, $R_i = \dfrac{a - c - b\sum_{j \ne i} q_j}{2b}$. For **two firms** the map is a contraction (each step multiplies the distance to the equilibrium by $\tfrac12$), so adjustment, whether alternating or simultaneous, converges to the Cournot equilibrium. With **simultaneous** adjustment by $n$ firms the deviation of total output from equilibrium is multiplied by $-(n-1)/2$ at each step, so convergence holds exactly when $n < 3$: for $n = 3$ the deviation oscillates without shrinking and for $n \ge 4$ it grows (until quantities hit zero). With **sequential** adjustment (firms move one at a time) the process converges for every $n$.`,
      idea: String.raw`For two firms the composite map $q_1 \mapsto R_1(R_2(q_1))$ has slope $\tfrac12 \cdot \tfrac12 = \tfrac14$ in absolute value, and the one-step map has factor $\tfrac12$: a contraction on $\mathbb{R}$, so the contraction principle (pma-9.23) gives a unique fixed point, the equilibrium, that every start converges to. For $n$ firms moving simultaneously, symmetrical deviations $x_i = q_i - q^*$ obey $x_i^{t+1} = -\tfrac12\sum_{j\ne i} x_j^{t}$, and for equal deviations the factor is $-(n-1)/2$, which has modulus $\ge 1$ once $n \ge 3$. Moving one at a time is the Gauss–Seidel iteration for a symmetric positive definite system, which converges.`,
      caption: String.raw`**Drag the gold start** (firm 1 starts at its $x$, all other firms at its $y$); choose **simultaneous** or **one at a time**, and the number of firms $n$. Left: the path of $(q_1, q_2)$ in the output plane (for $n = 2$ with both reaction lines: the path staircases into the crossing). Right: total output over 24 rounds against its equilibrium value. Simultaneous play with $n = 2$ spirals in; with $n = 3$ it cycles; with $n \ge 4$ it blows up; one at a time converges for any $n$. The readout reports the measured shrink factor per round.`,
      deps: ['micro-10.10', 'pma-9.23'],
      refs: ['Varian Ch. 28'], tags: ['oligopoly', 'stability'],
      credit: 'R. D. Theocharis, On the Stability of the Cournot Solution on the Oligopoly Problem, Review of Economic Studies 27 (2): 133–134, 1960',
      verify: true,
      scope: String.raw`Linear demand, identical constant marginal costs, and naive best-reply (Cournot) dynamics with quantities truncated at zero. Other cost or demand shapes change the thresholds.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cournot_competition' },
      viz(v) {
        const mode = v.select('adjustment', [{ value: 'sim', label: 'simultaneous' }, { value: 'seq', label: 'one at a time' }], 'sim');
        const nS = v.slider('number of firms $n$', 2, 6, 2, { int: true });
        const a = 12, b = 1, c = 2, T = 24;
        const s = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, equal: true, xlabel: '$q_1$', ylabel: '$q_2$', height: 400, title: 'path of firms 1 and 2' });
        const G = v.stage({ x: [0, T], y: [0, 32], axes: 'box', gutter: true, xlabel: 'round $t$', ylabel: 'total output $Q_t$', height: 400, title: 'total output', weight: 0.9, minWidth: 250 });
        v.legend([['accent', 'path'], ['orange', 'reaction lines (n = 2)'], ['green', 'equilibrium', { dot: true }], ['gold', 'start', { dot: true }]]);
        const H = s.handle(8, 1, { color: 'gold', r: 9, label: 'start', labelPos: 'ne', constrain: { x: [0.05, 9.9], y: [0.05, 9.9] } });
        const stepSim = (q) => { const S_ = q.reduce((x, y) => x + y, 0); return q.map((qi) => Math.max(0, (a - c - b * (S_ - qi)) / (2 * b))); };
        const stepSeq = (q) => { const r = q.slice(); for (let i = 0; i < r.length; i++) { const o = r.reduce((x, y) => x + y, 0) - r[i]; r[i] = Math.max(0, (a - c - b * o) / (2 * b)); } return r; };
        let st = {};
        v.render(() => {
          const n = nS.value, sim = mode.value === 'sim', qs = (a - c) / ((n + 1) * b), Qs = n * qs;
          let q = [H.x, ...Array(n - 1).fill(H.y)]; const path = [q.slice(0, 2)], tot = [q.reduce((x, y) => x + y, 0)];
          for (let t = 0; t < T; t++) { q = sim ? stepSim(q) : stepSeq(q); path.push(q.slice(0, 2)); tot.push(q.reduce((x, y) => x + y, 0)); }
          if (n === 2) { s.line((a - c) / (2 * b), 0, 0, a - c, { color: 'orange', width: 2.2 }); s.line(0, (a - c) / (2 * b), (a - c), 0, { color: 'orange', width: 2.2 }); }
          s.path(sim || n > 2 ? path : (() => { const r = []; path.forEach((p, i) => { r.push(p); if (i + 1 < path.length) r.push([path[i + 1][0], p[1]]); }); return r; })(), { color: 'accent', width: 2 });
          path.forEach((p, i) => s.dot(p[0], p[1], { r: i === 0 ? 5 : 3, color: i === 0 ? 'gold' : 'accent' }));
          s.dot(qs, qs, { r: 8, color: 'green' });
          G.hline(Qs, { color: 'green', width: 2 });
          G.path(tot.map((y, i) => [i, y]), { color: 'accent', width: 2.2 }); G.dots(tot.map((y, i) => [i, y]), { r: 3, color: 'accent' });
          const dev = tot.map((y) => y - Qs); let ratio = NaN; for (let t = 2; t < 8; t++) if (Math.abs(dev[t]) > 1e-6 && Math.abs(dev[t + 1]) < 1e5) { ratio = dev[t + 1] / dev[t]; break; }
          st = { n, sim, ratio, theory: -(n - 1) / 2, end: Math.abs(dev[T]), Qs };
        });
        v.readout(() => `$n = ${st.n}$, equilibrium total $${fx(st.Qs)}$. Measured factor per round: $${Number.isNaN(st.ratio) ? '—' : fx(st.ratio, 3)}$${st.sim ? `; the derivation predicts $-(n-1)/2 = ${fx(st.theory, 2)}$ for the deviation of total output while all quantities stay positive` : ' (one round = every firm moves once)'}.\nAfter 24 rounds the distance from equilibrium is $${fx(st.end, 4)}$: ${st.end < 0.01 ? 'converged.' : 'not converging.'}`);
      },
    },
  ],
};
