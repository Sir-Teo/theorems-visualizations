// Microeconomics — Chapter 10: Market power: monopoly and oligopoly — items 10.18–10.22
import { clamp, fx, bisect, argmax, plateText, bar, lin, mstage, tag, integ, tween } from './ch10.shared.js';

export default {
  collection: 'micro',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.18
    {
      num: '10.18', kind: 'Concept', name: 'Two-part tariffs',
      statement: String.raw`A **two-part tariff** charges a fixed **entry fee** $F$ for the right to buy and a per-unit price $p$: the buyer's bill for $q$ units is $F + pq$. If all buyers are identical with demand $q(p)$ and consumer surplus $CS(p)$, the seller maximizes $F + (p - c)q(p)$ subject to $F \le CS(p)$; the best choice is $p = c$ (marginal cost) and $F = CS(c)$, which extracts the whole surplus and is **efficient**, like perfect price discrimination (10.5). With two types of buyers of different demand and no way to tell them apart, a single fee must be low enough for the **low-demand** type to join, $F \le CS_L(p)$, and the optimal per-unit price is then **above** marginal cost, $p^* > c$, trading a small efficiency loss for a larger fee; when the low type is sufficiently weak the seller does better to set a high fee and serve only the high type.`,
      idea: String.raw`With one type, the profit $CS(p) + (p - c)\,q(p)$ is exactly the total surplus (3.6, 10.2), which is largest at $p = c$; every unit price above cost destroys more surplus than the unit price captures, and the fee takes back the rest. With two types the fee can be no larger than the low type's surplus, $F = CS_L(p)$, and both types pay it. Raising $p$ above $c$ then lowers fee revenue by $2q_L$ per unit of $p$ but raises markup revenue by about $q_H + q_L$ per unit of $p$ (less $2(p - c)$ from the units lost); the net effect, $(q_H - q_L) - 2(p - c)$, is positive at $p = c$ because the high type buys more, and vanishes at $p^* = c + (a_H - a_L)/2$ for linear demands $q = a - p$. The unit price is thus the instrument that extracts surplus from the high type, who buys more units, without losing the low type.`,
      caption: String.raw`An amusement park: demand $q = a - p$ for rides, marginal cost $c = 1$. Left: the demand curves, the **ride price** $p$ and the **entry fee** (the triangle of surplus one customer type is charged). Right: **profit as a function of $(p, F)$** (brighter = more profit; empty above the largest fee anyone will pay): drag $p$ and $F$ and see the profit; the purple dot is the optimum found by search. With **one customer type** it sits at $p = c$; switch on the **second, low-demand type** and the optimum moves to $p > c$ and a lower fee, unless the low type is too weak to be worth serving.`,
      deps: ['micro-10.5', 'micro-3.6'],
      refs: ['Varian Ch. 26'], tags: ['pricing', 'monopoly'],
      credit: 'W. Y. Oi, A Disneyland Dilemma: Two-Part Tariffs for a Mickey Mouse Monopoly, Quarterly Journal of Economics 85 (1): 77–96, 1971',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Two-part_tariff' },
      viz(v) {
        const two = v.toggle('second, low-demand type', false);
        const aLS = v.slider('low type demand intercept $a_L$', 4, 9.5, 8, { step: 0.05 });
        const pS = v.slider('ride price $p$', 0, 9.5, 3, { step: 0.05 });
        const fS = v.slider('entry fee $F$', 0, 50, 20, { step: 0.1 });
        const aH = 10, c = 1;
        const S = mstage(v, { x: [0, 10], y: [0, 11], title: 'demand and the fee', xlabel: 'rides $q$', ylabel: 'price per ride' });
        const H = v.stage({ x: [0, 9.5], y: [0, 50], axes: 'box', gutter: true, xlabel: 'ride price $p$', ylabel: 'entry fee $F$', height: 360, title: 'profit in the $(p, F)$ plane', weight: 1, minWidth: 260 });
        v.legend([['accent', 'high type'], ['orange', 'low type'], ['green', 'entry fee = surplus left to the buyer', { area: true }], ['gold', 'your tariff', { dot: true }], ['purple', 'best tariff', { dot: true }]]);
        const CS = (a, p) => (p >= a ? 0 : (a - p) ** 2 / 2), Q = (a, p) => Math.max(0, a - p);
        const profit = (p, F, aL, both) => {
          const csL = CS(aL, p), csH = CS(aH, p);
          if (both && F <= csL + 1e-9) return 2 * F + (p - c) * (Q(aH, p) + Q(aL, p));
          if (F <= csH + 1e-9) return F + (p - c) * Q(aH, p);
          return 0;
        };
        const best = (aL, both) => { let b = { pr: -1, p: c, F: 0 }; for (let p = 0; p <= 9.5; p += 0.05) for (const F of [CS(aH, p), both ? CS(aL, p) : -1]) if (F >= 0) { const pr = profit(p, F, aL, both); if (pr > b.pr) b = { pr, p, F }; } return b; };
        let st = {};
        v.render(() => {
          const both = two.value, aL = aLS.value, p = pS.value, F = fS.value;
          aLS.el.hidden = !both;
          const opt = best(aL, both), pr = profit(p, F, aL, both);
          S.fn((q) => aH - q, { domain: [0, 10], color: 'accent', width: 2.6 });
          if (both) S.fn((q) => aL - q, { domain: [0, aL], color: 'orange', width: 2.6 });
          S.hline(c, { color: 'muted', width: 1.4, dash: [3, 3] });
          const aF = both ? aL : aH;
          S.poly([[0, aF], [Math.max(0, aF - p), p], [0, p]], { fill: 'green', fillAlpha: 0.28, stroke: false });
          S.hline(p, { color: 'ink', width: 2.2 });
          tag(S, 'cost $c$', 9.9, c, 'muted', { align: 'right', dy: 12 }); tag(S, `$p = ${fx(p)}$`, 9.9, p, 'ink', { align: 'right', dy: -12 });
          H.heat((x, y) => profit(x, y, aL, both), { range: [0, 60], cmap: 'theme', res: 3, key: `pf|${both}|${aL}` });
          H.dot(p, Math.min(F, 49.5), { r: 8, color: 'gold' }); H.dot(opt.p, Math.min(opt.F, 49.5), { r: 8, color: 'purple' });
          H.line(0, 0, 0, 0, {});
          H.fn((x) => CS(aH, x), { domain: [0, 9.5], color: 'accent', width: 1.6 }); if (both) H.fn((x) => CS(aL, x), { domain: [0, 9.5], color: 'orange', width: 1.6 });
          st = { both, aL, p, F, pr, opt, cf: c + (aH - aL) / 2, soloH: best(aL, false) };
        });
        v.readout(() => `Your tariff $(p, F) = (${fx(st.p)}, ${fx(st.F)})$ earns $${fx(st.pr)}$ per pair of customers${st.both ? '' : ' (one type: per customer)'}. Best by search: $p^* = ${fx(st.opt.p)}$, $F^* = ${fx(st.opt.F)}$, profit $${fx(st.opt.pr)}$.\n${st.both ? `Serving both types needs $F \\le CS_L(p)$; the closed form $p^* = c + (a_H - a_L)/2 = ${fx(st.cf)}$ ${Math.abs(st.opt.p - st.cf) < 0.1 ? 'matches' : 'does not apply here because serving only the high type pays more (profit ' + fx(st.soloH.pr) + ')'}.` : 'With identical customers the optimum is $p^* = c = 1$ and $F^* = CS(c)$: the whole surplus becomes the fee.'}`);
      },
    },
    // ------------------------------------------------------------------ 10.19
    {
      num: '10.19', kind: 'Concept', name: 'Bundling',
      statement: String.raw`**Bundling** sells goods together at one price. A monopolist with two goods and buyers whose valuations $(v_1, v_2)$ vary can earn more from a **pure bundle** at price $p_B$ (bought when $v_1 + v_2 \ge p_B$) than from pricing the goods separately (each bought when $v_i \ge p_i$) when valuations are **negatively correlated**: the sum $v_1 + v_2$ is then less dispersed than either valuation, so one price can capture more of the total value. The advantage fades as the correlation rises and **vanishes when the valuations coincide**; with strongly positively correlated valuations separate sale is at least as good. Bundling is a form of price discrimination that needs no knowledge of who is who.`,
      idea: String.raw`A single price for a good loses buyers whose value is below it and leaves surplus with those above it; the more spread out the valuations, the larger these two losses. A bundle sold to buyers with valuations $(v_1, v_2)$ faces demand determined by the distribution of $v_1 + v_2$. If a buyer who likes good 1 tends to dislike good 2 (negative correlation), the sum is concentrated and a price near its centre sells to almost everyone at nearly full value. In the extreme of perfect negative correlation the sum is constant and the whole total is collected. Perfect positive correlation makes $v_1 + v_2 = 2v_1$: the bundle is just a double dose of one good and gains nothing. Adams and Yellen discussed these effects; McAfee, McMillan and Whinston showed how far they depend on correlation of values.`,
      caption: String.raw`Each dot is a customer with values $(v_1, v_2)$ for two goods (300 customers, uniform on $[0, 10]$, **alignment** $r$ slides the second value from opposite ($-1$) to identical ($+1$) to the first; the sample correlation is read out). **Separate sale:** drag $p_1, p_2$ and customers above both lines buy both; **bundle:** the diagonal $v_1 + v_2 = p_B$. Revenue per customer at your prices and at the best prices (found by search) is read out; the right panel plots the best revenue of each scheme against $r$ so you can see where bundling wins.`,
      deps: ['micro-10.5'],
      refs: ['Varian Ch. 26'], tags: ['pricing', 'monopoly'],
      credit: 'W. J. Adams & J. L. Yellen, Commodity Bundling and the Burden of Monopoly, Quarterly Journal of Economics 90 (3): 475–498, 1976; R. P. McAfee, J. McMillan & M. D. Whinston, Multiproduct Monopoly, Commodity Bundling, and Correlation of Values, Quarterly Journal of Economics 104 (2): 371–383, 1989',
      scope: String.raw`Zero marginal cost, one purchase of each good per customer, valuations drawn independently of the firm's choices; the valuation distribution here is an illustrative mixture, not data.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Product_bundling' },
      viz(v) {
        const rS = v.slider('alignment $r$', -1, 1, -0.6, { step: 0.05 });
        const mode = v.select('scheme', [{ value: 'sep', label: 'separate prices' }, { value: 'bun', label: 'pure bundle' }], 'bun');
        const p1S = v.slider('price of good 1', 0, 10, 5, { step: 0.05 });
        const p2S = v.slider('price of good 2', 0, 10, 5, { step: 0.05 });
        const pbS = v.slider('bundle price', 0, 20, 10, { step: 0.05 });
        const N = 300, rng = v.rng(11), U1 = Array.from({ length: N }, rng), U2 = Array.from({ length: N }, rng);
        const S = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, equal: true, xlabel: 'value of good 1', ylabel: 'value of good 2', height: 400, title: 'customers' });
        const G = v.stage({ x: [-1, 1], y: [0, 11], axes: 'box', gutter: true, xlabel: 'alignment $r$', ylabel: 'revenue per customer', height: 400, title: 'best revenue of each scheme', weight: 0.8, minWidth: 250 });
        v.legend([['accent', 'buys good 1 only / bundle', { dot: true }], ['green', 'buys everything', { dot: true }], ['muted', 'buys nothing', { dot: true }], ['ink', 'best separate'], ['purple', 'best bundle']]);
        const vals = (r) => { const a = Math.abs(r); return U1.map((u, i) => [10 * u, 10 * (a * (r >= 0 ? u : 1 - u) + (1 - a) * U2[i])]); };
        const bestSingle = (xs) => { const s_ = xs.slice().sort((p, q) => q - p); let b = 0, bp = 0; s_.forEach((x, i) => { if (x * (i + 1) > b) { b = x * (i + 1); bp = x; } }); return { rev: b / xs.length, p: bp }; };
        const best = (r) => { const V = vals(r), a = bestSingle(V.map((x) => x[0])), b = bestSingle(V.map((x) => x[1])), c = bestSingle(V.map((x) => x[0] + x[1])); return { sep: a.rev + b.rev, p1: a.p, p2: b.p, bun: c.rev, pb: c.p }; };
        const corr = (V) => { const mx = V.reduce((s_, x) => s_ + x[0], 0) / N, my = V.reduce((s_, x) => s_ + x[1], 0) / N; let sxy = 0, sxx = 0, syy = 0; V.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }); return sxy / Math.sqrt(sxx * syy); };
        const curve = []; for (let r = -1; r <= 1.0001; r += 0.1) { const b = best(Math.min(1, r)); curve.push([r, b.sep, b.bun]); }
        v.button('best prices', () => { const b = best(rS.value); p1S.set(b.p1); p2S.set(b.p2); pbS.set(b.pb); });
        let st = {};
        v.render(() => {
          const r = rS.value, V = vals(r), bun = mode.value === 'bun', p1 = p1S.value, p2 = p2S.value, pb = pbS.value;
          p1S.el.hidden = p2S.el.hidden = bun; pbS.el.hidden = !bun;
          let rev = 0;
          V.forEach(([x, y]) => {
            let col = 'muted';
            if (bun) { if (x + y >= pb) { col = 'green'; rev += pb; } } else { const b1 = x >= p1, b2 = y >= p2; if (b1) rev += p1; if (b2) rev += p2; col = b1 && b2 ? 'green' : b1 || b2 ? 'accent' : 'muted'; }
            S.dot(x, y, { r: 2.6, color: col, alpha: col === 'muted' ? 0.5 : 0.9 });
          });
          if (bun) S.line(Math.max(0, pb - 10), Math.min(10, pb), Math.min(10, pb), Math.max(0, pb - 10), { color: 'purple', width: 2.4 });
          else { S.vline(p1, { color: 'ink', width: 2 }); S.hline(p2, { color: 'ink', width: 2 }); }
          const b = best(r);
          G.path(curve.map((c_) => [c_[0], c_[1]]), { color: 'ink', width: 2.6 }); G.path(curve.map((c_) => [c_[0], c_[2]]), { color: 'purple', width: 2.6 });
          G.vline(r, { color: 'gold', width: 1.6, dash: [4, 3] }); G.dot(r, b.sep, { r: 6, color: 'ink' }); G.dot(r, b.bun, { r: 6, color: 'purple' });
          st = { r, rev: rev / N, b, c: corr(V), bun };
        });
        v.readout(() => `Sample correlation of the two values: $${fx(st.c, 2)}$. Your ${st.bun ? 'bundle price earns' : 'prices earn'} $${fx(st.rev)}$ per customer.\nBest by search: separate prices $(${fx(st.b.p1, 2)}, ${fx(st.b.p2, 2)})$ earn $${fx(st.b.sep)}$; the best bundle (price $${fx(st.b.pb, 2)}$) earns $${fx(st.b.bun)}$: bundling ${st.b.bun > st.b.sep + 0.005 ? 'wins' : Math.abs(st.b.bun - st.b.sep) <= 0.005 ? 'gives the same' : 'loses'}. No scheme can collect more than the total value, which averages $10$ per customer.`);
      },
    },
    // ------------------------------------------------------------------ 10.20
    {
      num: '10.20', kind: 'Model', name: 'Price leadership by a dominant firm',
      statement: String.raw`A **dominant firm** faces a **competitive fringe** of small price-taking firms with aggregate supply $S_f(p)$ and total demand $D(p)$. The fringe sells whatever it wants at the going price, so the dominant firm faces the **residual demand** $D_r(p) = D(p) - S_f(p)$, which is flatter than market demand. It sets the price $p^*$ at which its marginal revenue from residual demand equals its marginal cost, $MR_r(q_d) = MC_d(q_d)$, and the fringe supplies $S_f(p^*)$ at that price. The price lies between the monopoly and competitive prices: the larger the fringe's supply response, the closer to competitive and the smaller the dominant firm's share.`,
      idea: String.raw`Each unit the fringe supplies at a given price displaces a unit of the leader's sales, so the residual demand curve is market demand shifted left by the fringe's supply; with $D = a - p$ and $S_f = sp$ the inverse residual demand is $(a - q)/(1+s)$, and the leader behaves as a monopolist on it (10.2), with the elasticity rule (10.3) applied to the residual elasticity, which is larger than the market elasticity because it includes the fringe's response: $|\varepsilon_r| = (|\varepsilon_D| \cdot Q + \varepsilon_S\, S_f)/q_d$ in the usual decomposition. With no fringe ($s = 0$) the model reduces to monopoly; a very large fringe leaves the leader almost nothing to serve and the price falls toward the competitive one.`,
      caption: String.raw`Market demand $D(p) = 20 - p$ (blue) and fringe supply $S_f(p) = s\,p$ (teal): at every price the **horizontal gap** between them is the leader's residual demand (purple). Its marginal revenue (dashed purple) meets the leader's marginal cost (orange) at the gold point, which fixes the price. The bar at that price splits the market between the fringe (teal) and the leader (orange). **Slide the fringe's size $s$**: with $s = 0$ you get the monopoly point; as the fringe grows the price falls and the leader's share shrinks. Check in the readout that $D(p^*) = q_d + S_f(p^*)$.`,
      deps: ['micro-10.2', 'micro-8.4'],
      refs: ['Varian Ch. 28'], tags: ['oligopoly'],
      credit: 'K. Forchheimer, 1908, a dominant-firm model of partial monopoly; H. von Stackelberg, 1934; G. J. Stigler, 1940 (later developments of the model)',
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dominant_firm' },
      viz(v) {
        const sS = v.slider('fringe size $s$ ($S_f = s\\,p$)', 0, 4, 1, { step: 0.05 });
        const cS = v.slider('leader\'s marginal cost at zero $c_0$', 0, 8, 2, { step: 0.05 });
        const mS = v.slider('rise of leader\'s marginal cost $m$', 0, 0.5, 0.1, { step: 0.01 });
        const a = 20;
        const s = mstage(v, { x: [0, 22], y: [0, 22], title: 'market demand, fringe supply and the leader\'s residual demand', height: 400 });
        v.legend([['accent', 'market demand'], ['teal', 'fringe supply'], ['purple', 'residual demand'], ['purple', 'residual $MR$', { dash: true }], ['orange', 'leader\'s $MC$'], ['gold', 'leader\'s choice', { dot: true }]]);
        let st = {};
        v.render(() => {
          const sf = sS.value, c0 = cS.value, m = mS.value;
          const Pr = (q) => (a - q) / (1 + sf), MRr = (q) => (a - 2 * q) / (1 + sf), MC = (q) => c0 + m * q;
          const qd = bisect((q) => MRr(q) - MC(q), 0, a / 2, 60) ?? 0, p = Pr(qd), qf = sf * p, Q = a - p;
          // monopoly benchmark (no fringe)
          const qm = bisect((q) => a - 2 * q - MC(q), 0, a / 2, 60) ?? 0, pm = a - qm;
          s.fn((q) => a - q, { domain: [0, 20], color: 'accent', width: 2.6 });
          if (sf > 0) s.fn((q) => q / sf, { domain: [0, Math.min(22, 22 * sf)], color: 'teal', width: 2.6 });
          s.fn(Pr, { domain: [0, a], color: 'purple', width: 2.6 }); s.fn(MRr, { domain: [0, a / 2], color: 'purple', width: 2, dash: [5, 3] });
          s.fn(MC, { domain: [0, 22], color: 'orange', width: 2.6 });
          s.rect(0, p - 0.45, qf, p + 0.45, { fill: 'teal', fillAlpha: 0.55, color: 'teal', width: 1 }); s.rect(qf, p - 0.45, Q, p + 0.45, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1 });
          s.hline(p, { color: 'muted', width: 1, dash: [3, 3] });
          s.dot(qd, p, { r: 4, color: 'purple' }); s.dot(qd, MC(qd), { r: 7, color: 'gold' });
          s.dot(Q, p, { r: 5, color: 'accent' });
          s.dot(qm, pm, { r: 5, color: 'muted', hollow: true });
          tag(s, 'fringe', qf / 2, p, 'teal', { dy: -14 }); tag(s, 'leader', (qf + Q) / 2, p, 'orange', { dy: -14 }); tag(s, 'monopoly (s = 0)', qm, pm, 'muted', { dy: -12, dx: 36 });
          st = { p, qd, qf, Q, qm, pm, share: qd / Q, d: a - p };
        });
        v.readout(() => `Leader's price $${fx(st.p)}$ (monopoly with no fringe: $${fx(st.pm)}$). Quantities: leader $${fx(st.qd)}$, fringe $${fx(st.qf)}$, total $${fx(st.Q)}$ = $D(p) = ${fx(st.d)}$ ✓. Leader's share $${fx(100 * st.share, 1)}\\%$.`);
      },
    },
    // ------------------------------------------------------------------ 10.21
    {
      num: '10.21', kind: 'Proposition', name: 'Double marginalization',
      statement: String.raw`Suppose a monopolist upstream with constant marginal cost $c$ sells an essential input at a wholesale price $w$ to a monopolist downstream, who turns one unit of input into one unit of the final good and faces the demand $P(Q)$. Each firm adds its own markup, so the retail price exceeds the price that a **vertically integrated** monopolist would charge. With $P = a - bQ$: the integrated firm sells $Q^I = \dfrac{a - c}{2b}$ at $P^I = \dfrac{a + c}{2}$; the separate firms produce $Q^S = \dfrac{a - c}{4b} < Q^I$ at $P^S = \dfrac{3a + c}{4} > P^I$ (wholesale price $w^* = \tfrac{a+c}{2}$). **Total profit is lower** ($\tfrac{3}{16}$ against $\tfrac14$ of $(a-c)^2/b$) and consumers are worse off: merging, or any contract that removes the second markup, makes everyone better off.`,
      idea: String.raw`For a given $w$ the downstream firm is a monopolist with marginal cost $w$ (10.2): it sells where retail marginal revenue $a - 2bQ$ equals $w$, so the retail marginal revenue curve is the **demand curve for the input**. The upstream firm is a monopolist facing that demand, with its own marginal revenue $a - 4bQ$; it sets this equal to $c$. The integrated firm needs only one condition, retail $MR = c$, so its output is twice as large. Each step of the chain marks up over a cost that already includes the previous markup; the first markup is a cost to the second firm, not a transfer, because the second firm responds to it by cutting output, which hurts the first.`,
      caption: String.raw`The blue curve is retail demand, the purple curve is retail marginal revenue (= the downstream firm's demand for the input), the dashed purple line is the upstream firm's marginal revenue. **Two monopolies:** the upstream firm picks $w$ (move $w$ yourself, or press **upstream's best $w$**); the downstream firm responds with $Q(w)$ and a retail price. **Integrated:** retail $MR$ meets the cost $c$ directly. The right panel plots both firms' profits and their sum against $w$: the sum never reaches the integrated profit (grey line) when $w > c$, and equals it only at $w = c$, where the upstream firm earns nothing.`,
      deps: ['micro-10.2'],
      refs: ['Varian Ch. 27'], tags: ['monopoly', 'vertical relations'],
      credit: 'J. J. Spengler, Vertical Integration and Antitrust Policy, Journal of Political Economy 58 (4): 347–352, 1950',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Double_marginalization' },
      viz(v) {
        const mode = v.select('structure', [{ value: 'sep', label: 'two monopolies' }, { value: 'int', label: 'integrated' }], 'sep');
        const wS = v.slider('wholesale price $w$', 2, 12, 5, { step: 0.05 });
        const a = 12, b = 1, c = 2, D = lin(a, b);
        const s = mstage(v, { x: [0, 12], y: [0, 13], title: 'retail market', height: 380 });
        const G = v.stage({ x: [2, 12], y: [0, 28], axes: 'box', gutter: true, xlabel: 'wholesale price $w$', ylabel: 'profit', height: 380, title: 'profits against the wholesale price', weight: 0.8, minWidth: 260 });
        v.legend([['accent', 'retail demand'], ['purple', 'retail marginal revenue'], ['purple', 'upstream marginal revenue', { dash: true }], ['orange', 'cost $c$ (or $w$)'], ['gold', 'outcome', { dot: true }]]);
        const outcome = (w) => { const Q = Math.max(0, (a - w) / (2 * b)); return { Q, p: a - b * Q, pu: (w - c) * Q, pd: (a - b * Q - w) * Q }; };
        v.button('upstream\'s best $w$', () => wS.set(argmax((w) => outcome(w).pu, c, a, 100).x));
        let st = {};
        v.render(() => {
          const sep = mode.value === 'sep'; wS.el.hidden = !sep;
          const w = wS.value, o = outcome(w), QI = (a - c) / (2 * b), pI = a - b * QI, piI = (pI - c) * QI, bw = argmax((x) => outcome(x).pu, c, a, 100).x, ob = outcome(bw);
          s.fn(D.P, { domain: [0, 12], color: 'accent', width: 2.6 }); s.fn(D.MR, { domain: [0, 6], color: 'purple', width: 2.6 });
          s.fn((q) => a - 4 * b * q, { domain: [0, 3], color: 'purple', width: 2, dash: [5, 3] });
          if (sep) {
            s.hline(w, { color: 'orange', width: 2.4 }); s.rect(0, w, o.Q, o.p, { fill: 'green', fillAlpha: 0.25, stroke: false }); s.rect(0, c, o.Q, w, { fill: 'orange', fillAlpha: 0.25, stroke: false });
            s.dot(o.Q, w, { r: 5, color: 'purple' }); s.dot(o.Q, o.p, { r: 8, color: 'gold' });
            s.hline(c, { color: 'muted', width: 1.2, dash: [3, 3] });
          } else {
            s.hline(c, { color: 'orange', width: 2.4 }); s.rect(0, c, QI, pI, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1 });
            s.dot(QI, c, { r: 5, color: 'purple' }); s.dot(QI, pI, { r: 8, color: 'gold' });
          }
          G.fn((x) => outcome(x).pu, { domain: [c, a], color: 'orange', width: 2.4 }); G.fn((x) => outcome(x).pd, { domain: [c, a], color: 'accent', width: 2.4 });
          G.fn((x) => outcome(x).pu + outcome(x).pd, { domain: [c, a], color: 'ink', width: 2.4 }); G.hline(piI, { color: 'muted', width: 1.6, dash: [4, 3] });
          tag(G, 'upstream', 8.5, outcome(8.5).pu, 'orange', { dy: -12 }); tag(G, 'downstream', 4.5, outcome(4.5).pd, 'accent', { dy: -12 }); tag(G, 'sum', 3.5, outcome(3.5).pu + outcome(3.5).pd, 'ink', { dy: -12 }); tag(G, 'integrated', 11.5, piI, 'muted', { align: 'right', dy: -12 });
          if (sep) G.dot(w, o.pu + o.pd, { r: 6, color: 'gold' });
          st = { sep, w, o, QI, pI, piI, ob, bw, csI: 0.5 * b * QI * QI };
        });
        v.readout(() => st.sep ? `$w = ${fx(st.w)}$: output $${fx(st.o.Q)}$ at retail price $${fx(st.o.p)}$; upstream earns $${fx(st.o.pu)}$, downstream $${fx(st.o.pd)}$, total $${fx(st.o.pu + st.o.pd)}$. Upstream's best $w = ${fx(st.bw)}$ gives $Q = ${fx(st.ob.Q)}$, $P = ${fx(st.ob.p)}$, total profit $${fx(st.ob.pu + st.ob.pd)}$.\nIntegrated: $Q = ${fx(st.QI)}$, $P = ${fx(st.pI)}$, profit $${fx(st.piI)}$ (consumer surplus $${fx(st.csI)}$ against $${fx(0.5 * st.ob.Q * st.ob.Q)}$): lower price, higher output, higher profit.` : `Integrated monopolist: marginal revenue meets cost $c = ${c}$ at $Q = ${fx(st.QI)}$, price $${fx(st.pI)}$, profit $${fx(st.piI)}$. Two separate monopolies would sell only $${fx(st.ob.Q)}$ at $${fx(st.ob.p)}$ for a total profit of $${fx(st.ob.pu + st.ob.pd)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.22
    {
      num: '10.22', kind: 'Paper', name: 'Principes mathématiques de la théorie des richesses',
      paper: { authors: 'Augustin Cournot', year: 1838, title: 'Recherches sur les principes mathématiques de la théorie des richesses', venue: 'Paris: L. Hachette', url: 'https://gallica.bnf.fr/ark:/12148/bpt6k6117257c' },
      introduces: ['micro-10.2', 'micro-10.10', 'micro-10.11'],
      credit: 'A. A. Cournot, 1838',
      verify: true,
      statement: String.raw`Cournot's *Recherches* (1838) applied mathematics to economics for the first time on a large scale. It states the demand function $D = F(p)$, treats the **monopolist** who maximizes $pF(p) - \varphi(F(p))$ (chapter 5: the first-order condition equates marginal revenue and marginal cost), and then **competition between producers**: with two owners of mineral springs, each chooses its output taking the other's as given, and the price and quantities are determined by the intersection of two reaction relations (chapter 7). He shows that adding producers lowers the price towards marginal cost and that with a very large number the market approaches **unlimited competition** (chapter 8). In modern terms the book contains the Cournot equilibrium (a Nash equilibrium 110 years before Nash), the monopoly rule MR = MC and the convergence of Cournot oligopoly to competition.`,
      idea: String.raw`Before Cournot, writers on value used verbal arguments or numerical examples; he treated demand as a function of price, took derivatives, and derived laws that follow from the shape of the curves. The step that made the book influential much later was the oligopoly chapter: instead of assuming a rival will charge a price or produce a quantity set by someone else, he lets each producer maximize taking the other's quantity as fixed, which defines a stable intersection. The book had little immediate influence and was rediscovered in the later nineteenth century (an early critique is Bertrand's 1883 review, which proposed price rather than quantity as the strategic variable, 10.14). The ideas it introduced here: the monopoly rule (10.2), the duopoly equilibrium (10.10) and the many-firm limit (10.11).`,
      caption: String.raw`A **reconstruction in modern notation**, not a figure copied from the book: demand $P = a - Q$ (normalized, $a = 1$), zero cost (Cournot's springs). Left: the two reaction curves; **drag the gold start** and press play: the producers respond to each other in turn and the path converges to the crossing (this successive-reply path is the standard way of picturing the stability, 10.12, and is not claimed to be in the text). Right: the same market with $n$ producers (**slider**): price $a/(n+1)$ and total output $na/(n+1)$, from the monopoly ($n = 1$) towards the competitive limit $P = 0$, $Q = a$.`,
      deps: ['micro-2.1', 'pma-5.8'],
      refs: [], tags: ['oligopoly', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Antoine_Augustin_Cournot' },
      viz(v) {
        const nS = v.slider('number of producers $n$', 1, 30, 2, { int: true });
        const a = 1, PER = 7;
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, equal: true, xlabel: 'output of producer 1', ylabel: 'output of producer 2', height: 380, title: 'two proprietors: reaction curves' });
        const G = v.stage({ x: [1, 30], y: [0, 1], axes: 'box', gutter: true, xlabel: 'number of producers $n$', ylabel: 'price and total output', height: 380, title: 'adding producers', weight: 0.9, minWidth: 260 });
        v.legend([['accent', 'producer 1\'s reply'], ['orange', 'producer 2\'s reply'], ['green', 'Cournot point', { dot: true }], ['ink', 'price'], ['purple', 'total output']]);
        const H = s.handle(0.9, 0.05, { color: 'gold', r: 9, label: 'start', labelPos: 'ne', constrain: { x: [0.02, 0.98], y: [0.02, 0.98] } });
        const eqn = (n) => bisect((q) => a - n * q - q, 0, a, 60); // each: P + qP' = 0 with P = a − nq
        let st = {};
        v.animate((t) => {
          const R = (q) => Math.max(0, (a - q) / 2), steps = Math.min(18, Math.floor((t / PER) * 18 + 1e-9));
          let q1 = H.x, q2 = H.y; const path = [[q1, q2]];
          for (let i = 0; i < steps; i++) { if (i % 2 === 0) q1 = R(q2); else q2 = R(q1); path.push([q1, q2]); }
          const stair = []; path.forEach((p, i) => { stair.push(p); });
          s.line(0.5, 0, 0, 1, { color: 'accent', width: 2.4 }); s.line(0, 0.5, 1, 0, { color: 'orange', width: 2.4 });
          s.path(path, { color: 'muted', width: 2 }); path.forEach((p, i) => s.dot(p[0], p[1], { r: i === steps ? 5 : 3, color: 'gold' }));
          s.dot(a / 3, a / 3, { r: 8, color: 'green' }); tag(s, `$(a/3, a/3)$`, a / 3, a / 3, 'green', { dy: 18, dx: 26 });
          const n = nS.value, qn = eqn(n);
          G.fn((k) => a / (k + 1), { domain: [1, 30], color: 'ink', width: 2.6 }); G.fn((k) => (k * a) / (k + 1), { domain: [1, 30], color: 'purple', width: 2.6 });
          G.dot(n, a - n * qn, { r: 7, color: 'ink' }); G.dot(n, n * qn, { r: 7, color: 'purple' }); G.hline(a, { color: 'muted', width: 1, dash: [3, 3] });
          st = { n, qn, P: a - n * qn, Q: n * qn, q1, q2, steps };
        }, { period: PER + 1.5, once: true, still: PER + 1.5 });
        v.readout(() => `Reply $${st.steps}$ of 18: $(q_1, q_2) = (${fx(st.q1, 3)}, ${fx(st.q2, 3)})$, equilibrium $(a/3, a/3) = (${fx(1 / 3, 3)}, ${fx(1 / 3, 3)})$.\n$n = ${st.n}$ producers (solved from the first-order condition): price $${fx(st.P, 4)}$ (formula $a/(n+1) = ${fx(1 / (st.n + 1), 4)}$), total output $${fx(st.Q, 4)}$ (formula $na/(n+1) = ${fx(st.n / (st.n + 1), 4)}$); the monopoly $(n = 1)$ sells $a/2$ at $a/2$, the limit $n \\to \\infty$ is price $0$ and output $a$. These formulas are the same as the textbook ones: no discrepancy with today's accepted solution.`);
      },
    },
  ],
};
