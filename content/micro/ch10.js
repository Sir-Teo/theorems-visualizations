// Microeconomics — Chapter 10: Market power: monopoly and oligopoly (items 10.1–10.6; 10.7–10.12 in ch10-b.js, 10.13–10.17 in ch10-c.js, 10.18–10.22 in ch10-d.js)
import {screeningBenefit,screeningOptimum,screeningMenuState} from './source-audit-screening.js';
import {monopolyWelfareState,finiteDiscriminationState} from './source-audit-monopoly-welfare.js';
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
      num:'10.4',kind:'Concept',name:'Deadweight loss of monopoly',
      statement:String.raw`With integrable willingness to pay $P(Q)$, constant marginal cost $c>0$, no fixed cost and no external effects, total surplus is
$$W(Q)=\int_0^Q P(x)\,dx-cQ.$$
Suppose demand is differentiable and strictly decreasing, crosses c at a finite quantity, and has an interior single-price profit maximum. Monopoly chooses $MR(Q^m)=c$, whereas the efficient quantity satisfies $P(Q^c)=c$. Thus $Q^m<Q^c$, and
$$\begin{aligned}
DWL&=W(Q^c)-W(Q^m)\\
&=\int_{Q^m}^{Q^c}(P(Q)-c)\,dQ>0.
\end{aligned}$$
The rectangle $Q^m(P^m-c)$ is a transfer from consumers to the seller, not an additional loss. The loss measures forgone gains from trade; this unweighted sum of monetary surpluses does not decide how desirable their distribution is.`,
      idea:String.raw`Increasing output changes total surplus by $P(Q)-c$, so surplus rises up to $Q^c$ and falls thereafter. A single-price seller stops earlier: selling another unit lowers the price on earlier sales, making marginal revenue lower than willingness to pay. On the missing units between $Q^m$ and $Q^c$, value exceeds cost. For linear demand the loss region is a triangle; for a curved demand it is the corresponding curved area. With constant cost, the consumer-surplus reduction equals the seller's transfer plus this loss.`,
      caption:String.raw`Choose linear demand $P=12-Q$ or constant-elasticity demand $P=8Q^{-1/e}$, $e>1$, and vary cost and elasticity. Both chosen quantities and the whole loss region remain in view, including very large quantities at low cost. The constant-elasticity demand and MR branches continue above the finite price window as $Q\to0$; their omitted high-price parts are included in the exact surplus integral. Right: the complete surplus curve from $Q=0$ through both choices, with its maximum at $Q^c$.`,
      deps:['micro-10.2','micro-3.6'],refs:['J. Gruber, MIT 14.01SC Lecture 14 (2011), welfare section PDF pp14–15'],tags:['monopoly','welfare'],
      scope:String.raw`Partial equilibrium with demand as monetary willingness to pay, no income effects or distributional weights, constant cost cQ and no externalities, fixed costs or entry decision. The two explicit demand families have unique interior monopoly and efficient quantities; e>1 makes the isoelastic benefit integral finite at zero.`,
      verify: false,links:{source:'https://ocw.mit.edu/courses/14-01sc-principles-of-microeconomics-fall-2011/b3a72b11f5f3f988c386979f5038ca94_MIT14_01SCF10_lec14_300k.pdf'},
      viz(v){
        const kind=v.select('demand',[{value:'lin',label:'linear'},{value:'iso',label:'constant elasticity'}],'lin');
        const cost=v.slider('marginal cost $c$',.5,5,2,{step:.05}),elasticity=v.slider('elasticity $e$ (constant-elasticity case)',1.4,4,2,{step:.05});
        const A=mstage(v,{x:[-1,13],y:[-1,14],title:'monopoly, efficiency and the forgone trades'});
        const B=v.stage({x:[-1,13],y:[-5,80],axes:'box',gutter:true,xlabel:'quantity $Q$',ylabel:'total surplus $W(Q)$',height:360,title:'exact surplus from zero output',weight:.9,minWidth:250});
        v.legend([['accent','demand'],['purple','marginal revenue'],['orange','marginal cost'],['green','transfer / monopoly',{area:true}],['red','deadweight loss',{area:true}],['gold','efficient choice',{dot:true}],['ink','total surplus']]);
        let info={};
        v.render(()=>{
          const p=monopolyWelfareState(kind.value,cost.value,elasticity.value);elasticity.el.hidden=p.linear;
          const xmax=p.linear?12:1.08*p.qc,top=p.linear?12:1.25*p.pm;
          A.setView([-.06*xmax,1.08*xmax],[-.07*top,1.14*top]);
          A.rect(0,p.c,p.qm,p.pm,{fill:'green',fillAlpha:.3,color:'green',width:1});
          A.between(p.demand,()=>p.c,p.qm,p.qc,{fill:'red',fillAlpha:.4});
          const qlo=p.linear?0:(8/(.97*top))**p.e,mrlo=p.linear?0:(8*p.r/(.97*top))**p.e;
          A.fn(p.demand,{domain:[qlo,xmax],color:'accent',width:2.6});
          A.fn(p.marginalRevenue,{domain:[mrlo,p.linear?6:xmax],color:'purple',width:2.5});
          A.hline(p.c,{color:'orange',width:2.2});A.vline(p.qm,{color:'green',dash:[3,3],width:1});A.vline(p.qc,{color:'gold',dash:[3,3],width:1});
          A.dot(p.qm,p.pm,{r:6,color:'green'});A.dot(p.qm,p.c,{r:4,color:'orange'});A.dot(p.qc,p.c,{r:6,color:'gold'});
          B.setView([-.06*xmax,1.08*xmax],[-.07*p.wc,1.15*p.wc]);
          B.fn(p.welfare,{domain:[0,xmax],color:'ink',width:2.5});B.vline(p.qm,{color:'green',dash:[3,3],width:1});B.vline(p.qc,{color:'gold',dash:[3,3],width:1});
          B.dot(p.qm,p.wm,{r:6,color:'green'});B.dot(p.qc,p.wc,{r:6,color:'gold'});
          B.line(p.qm,p.wm,p.qm,p.wc,{color:'red',width:3});B.line(p.qm,p.wc,p.qc,p.wc,{color:'muted',dash:[3,3],width:1});
          info={...p,xmax,top,qlo,mrlo};
        });
        v.readout(()=>`Monopoly: $Q^m=${fx(info.qm,3)}$, $P^m=${fx(info.pm,3)}$; efficient: $Q^c=${fx(info.qc,3)}$, price $c=${fx(info.c,3)}$.\nTransfer / monopoly profit $${fx(info.transfer,3)}$, monopoly consumer surplus $${fx(info.cs,3)}$; $W(Q^m)=${fx(info.wm,3)}$, $W(Q^c)=${fx(info.wc,3)}$. Deadweight loss $${fx(info.dwl,3)}$; the consumer-surplus reduction is $${fx(info.competitiveCS-info.cs,3)}$ = transfer + loss. All integrals include the complete interval from zero.`);
      },
    },
    // ------------------------------------------------------------------ 10.5
    {
      num:'10.5',kind:'Concept',name:'First-degree price discrimination',
      statement:String.raw`Perfect price discrimination is an ideal in which the seller knows each buyer's willingness to pay, can make individual offers and prevents resale. If each buyer wants at most one unit with value $v_i$, production costs $c$ per unit and indifferent buyers accept, the seller can charge each served buyer $v_i$ and serve every buyer with $v_i\ge c$. Then
$$\begin{aligned}
CS&=0,\qquad DWL=0,\\
\pi=TS^*&=\sum_i\max\{v_i-c,0\}.
\end{aligned}$$
With divisible demand, the corresponding efficient quantity satisfies $P(Q^c)=c$ and captured surplus is $\int_0^{Q^c}(P-c)\,dQ$. This is efficiency in the unweighted monetary-surplus sense; buyers retain none of the gains. Equality-value units may be served or omitted without changing surplus.`,
      idea:String.raw`With an individual offer, lowering the payment for one buyer need not lower anyone else's payment. The seller therefore captures each nonnegative gain $v_i-c$, rather than restricting sales to protect a common price. A buyer offered exactly their value is indifferent, so full extraction uses the stated acceptance convention; an arbitrarily small discount gives strict acceptance and arbitrarily close extraction. Known values, enforceable individual offers and blocked resale are strong assumptions. The best common price remains feasible, so its maximum profit cannot exceed perfect-discrimination profit.`,
      caption:String.raw`Each unit-width column is one buyer with value $v_i=10[1-(i-1/2)/n]$. Vary buyer count, cost and an experimental common price, or press **best single price** for the exact finite-market optimum. Blue is buyer surplus, green is nonnegative seller margin, and red in the buyer panel shows lost gains on omitted buyers or waste from serving buyers whose value is below cost. A common price below cost can force a loss; it is not the optimizing monopoly policy. Right: signed profit, consumer surplus, actual total, efficient total and loss are exact sums. Perfect discrimination serves all nonnegative-gain buyers and captures the efficient total.`,
      deps:['micro-10.2','micro-3.6','micro-10.4'],refs:['G. Ellison, MIT 14.271 Lecture 3 (2022), slides 3–5: first-degree discrimination and resale assumptions','S. Ellison, MIT 14.27 Lecture 13 (2014), first-degree section pp1–2'],tags:['price discrimination'],
      scope:String.raw`One indivisible unit per buyer, known distinct values, zero outside-option surplus, constant cost c per unit, no fixed or administrative cost, no resale and no distributional welfare weights. Indifferent buyers buy; below-cost common prices are deliberate policy experiments. Changing n changes the finite market rather than supplying an exact continuum demand.`,
      verify: false,links:{source:'https://ocw.mit.edu/courses/14-271-industrial-organization-i-fall-2022/mit14_271_f22_lec3slides.pdf'},
      viz(v){
        const mode=v.select('pricing',[{value:'uni',label:'one price'},{value:'pd',label:'perfect discrimination'}],'uni');
        const count=v.slider('number of buyers',5,40,12,{int:true}),price=v.slider('single price $p$',0,10,6,{step:.05}),cost=v.slider('marginal cost $c$',0,6,2,{step:.05});
        const A=v.stage({x:[-.5,12.5],y:[-.7,11],axes:'box',gutter:true,xlabel:'buyers in descending value order',ylabel:'price / willingness to pay',height:380,title:'one indivisible unit per buyer',minWidth:250});
        const B=v.stage({x:[-.65,4.65],y:[-10,60],axes:'box',gutter:true,xlabel:'exact finite-market accounting',ylabel:'monetary surplus',height:380,title:'profit, buyer surplus and efficiency',minWidth:250});
        v.legend([['accent','consumer surplus',{area:true}],['green','nonnegative seller margin',{area:true}],['red','missed gains / waste',{area:true}],['pink','negative amount (right)',{area:true}],['orange','marginal cost'],['ink','common price'],['gold','actual total'],['teal','efficient total']]);
        const best=v.button('best single price',()=>price.set(finiteDiscriminationState(count.value,cost.value,price.value).bestPrice));
        let info={};
        v.render(()=>{
          const p=finiteDiscriminationState(count.value,cost.value,price.value,mode.value==='pd');price.el.hidden=p.perfect;best.hidden=p.perfect;
          A.setView([-.06*p.n,1.06*p.n],[-.7,11.2]);
          p.buyers.forEach((b,i)=>{
            A.rect(i,0,i+1,b.value,{fill:'muted',fillAlpha:.12,color:'muted',width:.8});
            if(b.serve){
              if(b.pay>=p.c)A.rect(i,p.c,i+1,b.pay,{fill:'green',fillAlpha:.5,stroke:false});
              if(b.value>b.pay)A.rect(i,b.pay,i+1,b.value,{fill:'accent',fillAlpha:.4,stroke:false});
              if(b.value<p.c)A.rect(i,b.value,i+1,p.c,{fill:'red',fillAlpha:.45,color:'red',width:.8});
            }else if(b.value>p.c)A.rect(i,p.c,i+1,b.value,{fill:'red',fillAlpha:.4,color:'red',width:.8});
          });
          A.hline(p.c,{color:'orange',width:2.2});if(!p.perfect)A.hline(p.price,{color:'ink',width:2});
          const values=[p.profit,p.cs,p.total,p.efficient,p.dwl],colors=['green','accent','gold','teal','red'],names=['profit','CS','total','best','DWL'];
          const scale=Math.max(1,...values.map(Math.abs)),lo=Math.min(-.24*scale,1.3*Math.min(...values)),hi=1.2*Math.max(1,...values),labelY=lo+.055*(hi-lo);
          B.setView([-.65,4.65],[lo,hi]);B.hline(0,{color:'muted',width:1});
          values.forEach((y,i)=>{B.rect(i-.3,Math.min(0,y),i+.3,Math.max(0,y),{fill:y<0?'pink':colors[i],fillAlpha:.5,color:y<0?'pink':colors[i],width:1});B.text(names[i],i,labelY,{size:11,align:'center',color:'muted'});});
          info={...p,accounting:values};
        });
        v.readout(()=>`${info.sold} of ${info.n} buyers served (efficient nonnegative-gain count ${info.efficientSold}). Profit $${fx(info.profit,3)}$, consumer surplus $${fx(info.cs,3)}$, actual total $${fx(info.total,3)}$, efficient total $${fx(info.efficient,3)}$.\nDeadweight loss $${fx(info.dwl,3)}$ = missed gains $${fx(info.missed,3)}$ + waste $${fx(info.waste,3)}$. Exact best common price $${fx(info.bestPrice,4)}$ earns $${fx(info.bestProfit,3)}$; perfect discrimination earns $${fx(info.efficient,3)}$.${info.perfect?' All gains accrue to the seller; no surplus is lost.':info.price<info.c?' This below-cost price is an experiment with a loss, not a profit-maximizing monopoly choice.':''}`);
      },
    },
    // ------------------------------------------------------------------ 10.6
    {
      num:'10.6',kind:'Model',name:'Second-degree price discrimination',
      statement:String.raw`A seller with unobservable buyer types can offer the same menu of quantity/payment pairs to everyone. A type must prefer its intended package to buying nothing (**IR**) and to the other package (**IC**). Here $0.1\le\varphi\le0.8$ gives type shares $1-\varphi$ and $\varphi$, benefits are $V_i(Q)=\theta_iQ-Q^2/2$, unit cost is $c=2$, $\theta_H=10$ and $3\le\theta_L\le8$. Resale is blocked, and indifferent buyers choose their intended package. The optimal menu has
$$\begin{aligned}
Q_H^*&=8,\\
Q_L^*&=\max\left\{0,\frac{\theta_L-2-8\varphi}{1-\varphi}\right\}.
\end{aligned}$$
Its low payment is $T_L^*=V_L(Q_L^*)$; the high payment is $T_H^*=V_H(8)-(10-\theta_L)Q_L^*$. The low type receives zero surplus. When $Q_L^*>0$, its quantity is below the efficient $\theta_L-2$, so $V_L'(Q_L^*)>c$; the high type retains information rent $(10-\theta_L)Q_L^*$. At $\varphi\ge(\theta_L-2)/8$, the low package becomes $(0,0)$ and that rent is zero.`,
      idea:String.raw`At an optimum, low participation and the high type's temptation to select the low package bind. These constraints give the stated payments. Substitute them into expected profit: it becomes the sum of two strictly concave quadratic functions of the quantities. The high quantity maximizes total gains for that type. The low quantity trades off gains from low buyers against the extra rent owed to high buyers; its unconstrained optimum must be clipped at zero. The resulting ordered quantities also satisfy low IC and high IR, so this upper bound on profit is attainable. The equality cases use the stated choice rule, rather than strict incentives.`,
      caption:String.raw`The curves are total benefits. A buyer prefers a **larger vertical gap below its own curve**, not a point closer to it. Drag the gold low-package or green high-package handle, or use the package sliders when handles coincide. Vertical segments show the intended buyer's surplus; purple rings mark the exact optimum. Right: the four actual IR/IC slacks, with negative bars showing failed constraints. **Optimal menu** sets all four package controls; **low-type exclusion boundary** selects the exact share and its zero low package. Assigned profit is implementable only when every constraint holds under the choice rule.`,
      deps:['micro-10.5'],refs:['Maskin & Riley (1984), RAND Journal of Economics 15:171–196, §2 and finite-type self-selection argument in §3','S. Ellison, MIT 14.27 Lecture 13 (2014), two-type screening pp4–5','G. Ellison, MIT 14.271 Lecture 3 (2022), two-type model slides13–18'],tags:['price discrimination','information'],
      credit:'E. Maskin & J. Riley, Monopoly with Incomplete Information, RAND Journal of Economics 15 (2):171–196, 1984 (screening framework)',
      scope:String.raw`An explicit two-type quadratic-benefit model with a known high-type share 0.1–0.8, zero outside utility, nonnegative quantities, constant unit cost, no resale and intended-package choice at indifference. The quadratic benefits are used on the whole displayed range, including beyond their peaks. The plot shows nonnegative payments; the stated optimum is feasible there. This does not assert that every screening problem has the same binding constraints or that low types always buy positive quantities.`,
      links:{source:'https://ocw.mit.edu/courses/14-27-economics-and-e-commerce-fall-2014/01454b51f87e5907b6097de412687b59_MIT14_27F14_Lec13.pdf',doi:'https://doi.org/10.2307/2555674'},
      viz(v){
        const initial=screeningOptimum(.3,6);
        const share=v.slider('high-type share $\\varphi$',.1,.8,.3,{step:.01,decimals:3}),theta=v.slider('low type $\\theta_L$',3,8,6,{step:.05});
        const ql=v.slider('low package quantity $Q_L$',0,10,initial.qLow,{step:.05,decimals:3}),tl=v.slider('low package payment $T_L$',0,50,initial.tLow,{step:.05,decimals:3});
        const qh=v.slider('high package quantity $Q_H$',0,10,initial.qHigh,{step:.05,decimals:3}),th=v.slider('high package payment $T_H$',0,50,initial.tHigh,{step:.05,decimals:3});
        const A=v.stage({x:[-1,11],y:[-8,56],axes:'box',gutter:true,xlabel:'package quantity $Q$',ylabel:'total payment / benefit',height:400,title:'compare packages using vertical utility gaps',minWidth:250});
        const B=v.stage({x:[-.65,3.65],y:[-5,5],axes:'box',gutter:true,xticks:[],xlabel:'IR: participation; IC: self-selection',ylabel:'constraint slack',height:400,title:'nonnegative slacks make the menu feasible',minWidth:250});
        const low=A.handle(initial.qLow,initial.tLow,{color:'gold',r:9,constrain:(x,y)=>[clamp(x,0,10),clamp(y,0,50)],onDrag:h=>{ql.set(h.x);tl.set(h.y);}});
        const high=A.handle(initial.qHigh,initial.tHigh,{color:'green',r:9,constrain:(x,y)=>[clamp(x,0,10),clamp(y,0,50)],onDrag:h=>{qh.set(h.x);th.set(h.y);}});
        const place=()=>{const o=screeningOptimum(share.value,theta.value);ql.set(o.qLow);tl.set(o.tLow);qh.set(o.qHigh);th.set(o.tHigh);};
        v.button('optimal menu',place);v.button('low-type exclusion boundary',()=>{share.set((theta.value-2)/8);place();});
        v.legend([['orange','low total benefit'],['orange','efficient low quantity',{dash:true}],['accent','high total benefit'],['muted','cost $2Q$'],['gold','your low package / low slacks',{dot:true}],['green','your high package / high slacks',{dot:true}],['purple','optimal menu (hollow)',{dot:true}],['red','failed constraint']]);
        let info={};
        v.render(()=>{
          const p=screeningMenuState(share.value,theta.value,ql.value,tl.value,qh.value,th.value),o=p.optimum;
          low.set(p.qLow,p.tLow);high.set(p.qHigh,p.tHigh);
          A.setView([-1,11],[Math.min(-8,screeningBenefit(p.theta,10)-5),56]);
          A.fn(q=>screeningBenefit(p.theta,q),{domain:[0,10],color:'orange',width:2.5});A.fn(q=>screeningBenefit(10,q),{domain:[0,10],color:'accent',width:2.5});A.fn(q=>2*q,{domain:[0,10],color:'muted',width:1.4,dash:[3,3]});
          A.vline(o.efficientLow,{color:'orange',width:1,dash:[3,3]});
          A.line(p.qLow,p.tLow,p.qLow,p.benefitLow,{color:p.uLow>=0?'gold':'red',width:2});A.line(p.qHigh,p.tHigh,p.qHigh,p.benefitHigh,{color:p.uHigh>=0?'green':'red',width:2});
          A.dot(o.qLow,o.tLow,{r:12,hollow:true,color:'purple'});A.dot(o.qHigh,o.tHigh,{r:12,hollow:true,color:'purple'});
          const dataLo=Math.min(-1,1.2*Math.min(...p.slacks)),hi=Math.max(2,1.2*Math.max(...p.slacks)),lo=dataLo-.15*(hi-dataLo),labelY=lo+.04*(hi-lo);
          B.setView([-.65,3.65],[lo,hi]);B.hline(0,{color:'muted',width:1});const names=['IR L','IR H','IC L','IC H'];
          p.slacks.forEach((s,i)=>{const col=s<0?'red':i%2?'green':'gold';B.rect(i-.3,Math.min(0,s),i+.3,Math.max(0,s),{fill:col,fillAlpha:.5,color:col,width:1});B.text(names[i],i,labelY,{size:11,align:'center',color:'muted'});});
          info=p;
        });
        v.readout(()=>`IR L/H: ${fx(info.slacks[0],6)} / ${fx(info.slacks[1],6)}; IC L/H: ${fx(info.slacks[2],6)} / ${fx(info.slacks[3],6)}. ${info.feasible?'All four hold within numerical precision under intended-package choice.':'At least one constraint fails: the intended assignments are not implementable.'}\nAssigned-menu profit $${fx(info.assignedProfit,6)}$ ${info.feasible?'(implementable under the choice rule)':'(counterfactual assignment only)'}. Exact optimal profit $${fx(info.optimum.profit,6)}$ at $Q_L=${fx(info.optimum.qLow,6)}$, $Q_H=8$.\nOptimal low quantity versus efficient: ${fx(info.optimum.qLow,6)} versus ${fx(info.optimum.efficientLow,6)}; high-type rent $${fx(info.optimum.rentHigh,6)}$. Total-surplus loss relative to full information $${fx(info.optimum.loss,6)}$. ${info.optimum.excluded?'At the optimum the low package is (0,0) and the high-type information rent is zero.':'At the optimum the low type buys a downward-distorted quantity and the high type retains positive information rent.'}`);
      },
    },
  ],
};
