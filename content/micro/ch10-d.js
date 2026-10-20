// Microeconomics — Chapter 10: Market power: monopoly and oligopoly — items 10.18–10.22
import { clamp, fx, bisect, argmax, plateText, bar, lin, mstage, tag, integ, tween } from './ch10.shared.js';
import { dominantFirmState } from './source-audit-core-fringe.js';
import { COURNOT_EQUILIBRIUM, cournotProject, cournotState, cournotMany } from './source-audit-cournot.js';

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
      statement: String.raw`A price-setting firm faces a fixed competitive fringe whose price-taking supply is $S_f(p)$. Its nonnegative residual sales are the part of market demand remaining after that supply. This illustration specifies $D(p)=\max(0,20-p)$, $S_f(p)=sp$, and leader cost $C(q)=c_0q+mq^2/2$, with $s,c_0,m\ge0$. For $0\le q\le20$, inverse residual demand is $P_r(q)=(20-q)/(1+s)$, and the unique profit maximum is
$$q_d^*=\max\!\left\{0,\frac{20-(1+s)c_0}{2+(1+s)m}\right\}.$$
The market price is $p^*=P_r(q_d^*)$; the fringe sells $sp^*$, and their sum is $20-p^*$. At positive leader output, $MR_r=MC$. At zero output, $MR_r(0)\le MC(0)$ instead: the fringe clears the market at $20/(1+s)$. The equality rule alone misses this corner.`,
      idea: String.raw`Subtract fringe supply from market demand, then substitute the residual price into revenue. The leader's profit is a strictly concave quadratic in its output, so its derivative identifies the global maximum, clipped at zero. The right panel displays that objective, making both an interior maximum and a zero-output boundary visible.

For this specified family, price lies between the competitive benchmark and the same-cost monopoly benchmark. Larger fringe supply lowers price, but does not always drive leader output to zero: if $c_0=m=0$, output stays10 and its market share approaches one half as $s$ grows without bound. Positive $c_0$ gives exit once $(1+s)c_0\ge20$; with $c_0=0,m>0$, leader output tends to zero only in the limit.`,
      caption: String.raw`Left: complete market demand, inverse residual demand, residual marginal revenue, leader marginal cost, and fringe supply over prices0–20. The horizontal bands split total sales between fringe (teal) and leader (orange); a zero leader quantity has no orange band. The purple ring marks the residual-demand price and the gold marker lies on residual MR. At exit that gold point is below MC. Right: actual leader profit over every feasible output0–20, with its maximizing quantity marked. **Leader exit boundary** selects equality at zero output; move cost upward to enter the strict exit region.`,
      scope: String.raw`A static, homogeneous-product teaching model with fixed fringe size, no fixed costs, nonnegative quantities and common prices. Controls offer $0\le s\le4$, $0\le c_0\le8$, $0\le m\le0.5$. The fringe's linear supply is fixed while the leader chooses; dynamic entry is not simulated. The complete fringe curve is shown for $0\le p\le20$ and may extend to quantity80. The competitive benchmark makes the leader price-taking with the same marginal cost and the same fringe; monopoly removes the fringe. Historical market data and original Forchheimer/Stackelberg/Stigler results are not claimed reproduced.`,
      deps: ['micro-10.2', 'micro-8.4'],
      refs: ['Church & Ware (2000), Industrial Organization: A Strategic Approach, static §4.2 pp.124–129 before §4.2.1, equations4.1–4.7 and Figure4.2', 'https://irving.vassar.edu/faculty/gj/FTU/io/literature/church-ware.pdf'], tags: ['oligopoly'],
      credit: 'Church & Ware, 2000, §4.2 (reviewed modern framework; specified linear model derived here)',
      verify: false,
      links: { source: 'https://irving.vassar.edu/faculty/gj/FTU/io/literature/church-ware.pdf' },
      viz(v) {
        const sf=v.slider('fringe size $s$',0,4,1,{step:.05}),c=v.slider('leader cost intercept $c_0$',0,8,2,{step:.05,decimals:4}),m=v.slider('leader cost slope $m$',0,.5,.1,{step:.01});
        const A=v.stage({x:[-3,25],y:[-24,24],axes:'box',gutter:true,height:400,xlabel:'quantity (total, fringe or leader)',ylabel:'price / marginal revenue / cost',title:'residual demand and the quantity corner'});
        const B=v.stage({x:[-2,22],y:[-100,110],axes:'box',gutter:true,height:400,xlabel:'leader output q',ylabel:'leader profit',title:'the global profit maximum'});
        v.legend([['accent','market demand / total sales'],['teal','fringe supply / fringe band'],['purple','inverse residual demand'],['purple','residual MR',{dash:true}],['orange','leader MC / leader band'],['gold','chosen output on MR / profit'],['muted','monopoly benchmark',{dot:true}]]);
        v.button('leader exit boundary',()=>{const s=Math.max(2,sf.value);sf.set(s);c.set(20/(1+s));});
        let info={};
        v.render(()=>{
          const p=dominantFirmState(sf.value,c.value,m.value),xmax=Math.max(20,20*p.fringe);
          A.setView([-.12*xmax,1.12*xmax],[-24,24]);
          const low=Math.min(0,p.profitAt(20)),high=Math.max(1,p.profit),span=high-low;B.setView([-2,22],[low-.12*span,high+.2*span]);
          A.fn(q=>20-q,{domain:[0,20],color:'accent',width:2.5});
          A.curve(t=>[p.fringe*t,t],0,20,{color:'teal',width:2.4});
          A.fn(p.inverse,{domain:[0,20],color:'purple',width:2.5});A.fn(p.marginalRevenue,{domain:[0,20],color:'purple',width:2,dash:[5,4]});
          A.fn(p.marginalCost,{domain:[0,20],color:'orange',width:2.5});
          if(p.fringeQuantity>0)A.rect(0,p.price-.3,p.fringeQuantity,p.price+.3,{fill:'teal',fillAlpha:.4,color:'teal'});
          if(p.quantity>0)A.rect(p.fringeQuantity,p.price-.3,p.total,p.price+.3,{fill:'orange',fillAlpha:.45,color:'orange'});
          A.hline(p.price,{color:'muted',dash:[3,4],width:1});
          A.dot(p.quantity,p.price,{color:'purple',r:11,hollow:true});A.dot(p.quantity,p.mr,{color:'gold',r:7});A.dot(p.total,p.price,{color:'accent',r:5});
          A.dot(p.monopolyQuantity,p.monopolyPrice,{color:'muted',r:5,hollow:true});
          B.hline(0,{color:'muted',width:1});B.fn(p.profitAt,{domain:[0,20],color:'accent',width:2.6,n:300});B.dot(p.quantity,p.profit,{color:'gold',r:7});
          info=p;
        });
        v.readout(()=>{const p=info;return `Leader output ${fx(p.quantity,7)}, fringe ${fx(p.fringeQuantity,7)}, total ${fx(p.total,7)} = demand ${fx(20-p.price,7)}. Price ${fx(p.price,7)}; leader share ${fx(100*p.share,5)}%.\n$MR_r=${fx(p.mr,7)}$, $MC=${fx(p.mc,7)}$; derivative $MR_r-MC=${fx(p.derivative,9)}$. ${p.active?'Positive output: the derivative is zero.':'Zero output: the derivative is nonpositive; the fringe clears the market.'} Maximum profit ${fx(p.profit,7)}.\nSame-cost competitive price ${fx(p.competitivePrice,7)} ≤ chosen price ${fx(p.price,7)} ≤ no-fringe monopoly price ${fx(p.monopolyPrice,7)}.`;});
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
      num: '10.22', kind: 'Paper', name: 'Recherches sur les principes mathématiques de la théorie des richesses',
      paper: { authors: 'Augustin Cournot', year: 1838, title: 'Recherches sur les principes mathématiques de la théorie des richesses', venue: 'Paris: L. Hachette', url: 'https://gallica.bnf.fr/ark:/12148/bpt6k6117257c' },
      introduces: ['micro-10.2', 'micro-10.10', 'micro-10.11'],
      credit: 'A. A. Cournot, 1838',
      verify: false,
      statement: String.raw`Cournot's *Recherches* (1838) studies monopoly revenue $pF(p)$ and production cost $\varphi(F(p))$ in chapter V §§26–35. Chapter VII §§43–46 considers owners of mineral springs who choose quantities while taking rivals' quantities as fixed; §43 describes successive replies and the dotted staircase in figure 2. These are the source frameworks for the **authored linear specialization** below, with zero cost, nonnegative outputs and profit
$$\pi_i=q_i(1-q_i-Q_{-i}).$$
The unique best reply is $R(Q_{-i})=\max\{0,(1-Q_{-i})/2\}$. For $n$ identical firms the unique equilibrium has $q_i=1/(n+1)$, total output $Q=n/(n+1)$ and price $P=1/(n+1)$. Thus $n=1$ gives monopoly output and price $1/2$; as $n\to\infty$, $Q\to1$ and $P\to0$. These formulas are for the specified affine model, rather than a general convergence theorem for nonlinear demand.`,
      idea: String.raw`Holding rival output $r$ fixed, the quadratic objective has derivative $1-r-2q$ and second derivative $-2$. Its interior maximum satisfies the zero-derivative condition (PMA 5.8); the nonnegative boundary gives the clipped reply. An equilibrium cannot have $Q>1$: any positive producer loses money and could choose zero. At $Q=1$, a positive producer can halve its output to earn $q_i^2/4>0$ instead of zero. Hence $Q<1$, every firm produces positively, and $1-Q-q_i=0$ forces the stated symmetric solution.

For the displayed **duopoly**, start anywhere with $q_1,q_2\ge0$ and $q_1+q_2\le1$. Each reply preserves that triangle. With firm 1 responding first, after $m$ complete two-reply sweeps,
$$q_2^{(2m)}-\tfrac13=4^{-m}(q_2^{(0)}-\tfrac13).$$
Firm 1's error is minus twice this error for $m\ge1$. This proves convergence for every displayed start, including the boundary. It concerns alternating duopoly replies; the right panel computes static equilibria and simulates no many-firm adjustment. Cournot's chapter VIII §§50–54 studies unlimited competition under its own marginal-cost assumptions.`,
      caption: String.raw`Left: an affine reconstruction of the original chapter VII staircase, with both best-reply curves. **Drag the gold start**, or use either output control; increasing one output beyond the available triangle reduces the other. All three boundary vertices are accessible. **Selected reply 0–18** shows each successive response, firm 1 first: the faint full path retains the initial point and all 18 replies; the gold prefix ends at the current point. The green ring marks the exact equilibrium; the equilibrium button sets both start coordinates to $1/3$. Right: select any integer number of firms 1–30. The guides join those 30 discrete equilibria; a purple ring around the price marker shows their coincidence at $n=1$.`,
      scope: String.raw`Zero production and fixed costs, no capacity constraints, and strategy space $q_i\ge0$. The payoff uses the affine expression $P=1-Q$ even at hypothetical $Q>1$; it is a quadratic teaching extension. The displayed initial triangle keeps every illustrated duopoly price nonnegative and does not restrict a firm's strategy space. Replacing the payoff by $q_i\max(1-Q,0)$ defines a different game: for example, duopoly $(1,1)$ is then a zero-profit equilibrium, but not an equilibrium of the quadratic model. Outputs and prices are dimensionless under the chosen unit intercept and slope. The displayed numerical formulas and contraction proof are derived here, not transcribed source data.`,
      deps: ['micro-2.1', 'pma-5.8'],
      refs: ['Cournot (1838), chapter V §§26–35 pp.61–73; chapter VII §§43–49 pp.88–100, especially figure 2 and §46; chapter VIII §§50–54 pp.101–111', 'https://archive.org/download/AugustinCournotRecherches/Augustin%20Cournot%20Recherches.pdf'], tags: ['oligopoly', 'history'],
      links: { source: 'https://archive.org/download/AugustinCournotRecherches/Augustin%20Cournot%20Recherches.pdf', catalogue: 'https://catalogue.bnf.fr/ark:/12148/cb30280488q' },
      viz(v) {
        const q1=v.slider('initial output $q_1$',0,1,.9,{step:.01,decimals:5,onChange:x=>{if(x+q2.value>1)q2.set(1-x);}});
        const q2=v.slider('initial output $q_2$',0,1,.05,{step:.01,decimals:5,onChange:y=>{if(q1.value+y>1)q1.set(1-y);}});
        const step=v.slider('selected reply',0,18,18,{int:true}),nS=v.slider('number of producers $n$',1,30,2,{int:true});
        const s=v.stage({x:[-.16,1.16],y:[-.16,1.16],axes:'box',gutter:true,equal:true,xlabel:'producer 1 output',ylabel:'producer 2 output',height:400,title:'duopoly: alternating best replies'});
        const G=v.stage({x:[-2,33],y:[-.14,1.14],axes:'box',gutter:true,xlabel:'integer number of producers n',ylabel:'normalized price / total output',height:400,title:'static equilibria for 1–30 producers',weight:.9,minWidth:260});
        v.legend([['accent','producer 1 reply'],['orange','producer 2 reply'],['gold','start / selected prefix and current point'],['muted','all 18 replies'],['green','exact duopoly equilibrium',{dot:true}],['ink','price'],['purple','total output']]);
        const H=s.handle(q1.value,q2.value,{color:'gold',r:9,constrain:cournotProject,onDrag:h=>{q1.set(h.x);q2.set(h.y);}}),eq=COURNOT_EQUILIBRIUM;
        const all=Array.from({length:30},(_,i)=>cournotMany(i+1));
        v.button('Start at exact duopoly equilibrium',()=>{q1.set(eq);q2.set(eq);});
        let info={};
        v.render(()=>{
          const state=cournotState([q1.value,q2.value],step.value,nS.value),p=state.point,m=state.many;
          H.set(...state.start);
          s.poly([[0,0],[1,0],[0,1]],{fill:'faint',fillAlpha:.24,stroke:false});
          s.path([[0,0],[1,0],[0,1],[0,0]],{color:'faint',width:1.2});
          s.path([[.5,0],[0,1]],{color:'accent',width:2.6});s.path([[0,.5],[1,0]],{color:'orange',width:2.6});
          s.dot(eq,eq,{r:14,color:'green',hollow:true,width:2});
          s.path(state.path,{color:'muted',width:1.5,dash:[3,4]});
          s.path(state.path.slice(0,state.selected+1),{color:'gold',width:2.5});
          state.path.forEach(([x,y])=>s.dot(x,y,{r:2,color:'muted',ring:false}));
          s.dot(p[0],p[1],{r:5,color:'gold'});
          tag(s,'$(1/3,1/3)$',.57,.35,'green',{dy:-17});
          G.path(all.map(p=>[p.n,p.price]),{color:'ink',width:2.6});G.path(all.map(p=>[p.n,p.total]),{color:'purple',width:2.6});
          G.line(1,1,30,1,{color:'muted',width:1.2,dash:[3,4]});
          G.dot(m.n,m.total,{r:m.n===1?12:7,color:'purple',hollow:m.n===1,width:2});G.dot(m.n,m.price,{r:7,color:'ink'});
          info=state;
        });
        v.readout(()=>{const p=info,m=p.many;return `Reply ${p.selected} of 18, firm 1 first: current outputs (${fx(p.point[0],8)}, ${fx(p.point[1],8)}), price ${fx(p.price,8)}; profits (${fx(p.profits[0],8)}, ${fx(p.profits[1],8)}). All 19 path points are retained, including the initial point.\nAfter each complete two-reply sweep, producer 2's error from 1/3 is exactly one quarter of its previous error in the real-arithmetic model. This proves the displayed duopoly convergence; reply 18 is a finite state, not an exact equilibrium certificate.\n${m.n} producers: each output ${fx(m.q,8)}, total ${fx(m.total,8)}, price ${fx(m.price,8)}, profit per firm ${fx(m.firmProfit,8)}. These are exact static formulas, with floating-point display; no many-firm adjustment is simulated.`;});
      },
    },
  ],
};
