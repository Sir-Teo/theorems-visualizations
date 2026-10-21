// Microeconomics — Chapter 10: Market power: monopoly and oligopoly — items 10.7–10.12
import { clamp, GUIDE, fx, bisect, argmax, plateText, bar, lin, iso, mstage, tag, integ, tween, polyArea } from './ch10.shared.js';
import {discriminationState,entryState,cournotAdjustment,cournotPotential} from './source-audit-market-power.js';

export default {
  collection: 'micro',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.7
    {
      num:'10.7',kind:'Concept',name:'Third-degree price discrimination',
      statement:String.raw`A seller can charge observable buyer groups different prices when the markets are separable and resale is prevented. For independent inverse demands $P_i(q_i)$ and a common production cost $C(Q)$, $Q=\sum_iq_i$, an interior profit optimum satisfies
$$MR_i(q_i)=C'(Q).$$
A market with zero sales instead satisfies $MR_i(0)\le C'(Q)$. In an active market the equivalent elasticity condition is $P_i(1-1/|\varepsilon_i|)=MC$. With **positive** common marginal cost this ranks a higher optimal price with a lower absolute demand elasticity. At $MC=0$ that ranking is degenerate: active markets have unit elasticity and can have different prices.

Allowing separate prices cannot reduce the seller's maximum profit because a uniform price remains feasible. Output and total surplus need not move with profit. For linear demands and constant marginal cost, total output is unchanged **when both markets are served under both policies**; discrimination then weakly reduces total surplus through a less efficient allocation of the same output.`,
      idea:String.raw`Transfer a small amount of output between two active markets while holding total production fixed: revenue rises if it moves toward the higher marginal revenue. Expand total output until the common marginal revenue equals marginal cost. Nonnegative sales require the corresponding inequality at a closed market. Under a single price, aggregate demand has kinks where a market stops buying; compare the optimum in every active-market interval and at each kink. A zero-sales market has no finite point elasticity to report. With constant cost, changing a linear demand's slope changes its quantity but its separate-price optimum is $(a_i+c)/2$; slope alone does not determine a price difference.`,
      caption:String.raw`Compare separate prices with the exact best uniform price for $P_1=16-q_1$, $P_2=a_2-b_2q_2$ and $C(Q)=cQ+mQ^2/2$. Each panel includes the complete demand and nonnegative marginal-revenue branch. Green area is consumer surplus. Orange is the common optimal marginal cost under separate prices or the posted uniform price. A closed market is identified explicitly; its choke-price marker does not mean an active transaction. Compare profit, output and total surplus in the readout.`,
      deps:['micro-10.3'],refs:['S. Ellison, MIT 14.27 Lecture 13 (2014), third-degree section p3','R. Schmalensee, MIT Sloan WP1095-80 (1980), output/welfare results and market-exclusion qualification'],tags:['price discrimination'],
      scope:String.raw`Two independent linear markets, observable groups, no resale or cross-price effects, one cost C(Q)=cQ+mQ²/2 and nonnegative sales. Surplus is the integral of willingness to pay less production cost, with no distributional weights or income effects. No legal or empirical claim is inferred.`,
      verify: false,
      links:{source:'https://ocw.mit.edu/courses/14-27-economics-and-e-commerce-fall-2014/01454b51f87e5907b6097de412687b59_MIT14_27F14_Lec13.pdf'},
      viz(v){
        const mode=v.select('pricing',[{value:'disc',label:'separate prices'},{value:'uni',label:'one price'}],'disc');
        const a2=v.slider('market 2 intercept $a_2$',8,20,12,{step:.1}),b2=v.slider('market 2 slope $b_2$',.5,3,1.5,{step:.05}),cost=v.slider('marginal-cost intercept $c$',0,6,2,{step:.05}),rise=v.slider('marginal-cost slope $m$',0,.5,.1,{step:.01});
        const stages=[1,2].map(i=>v.stage({x:[-1,18],y:[-1,23],axes:'box',gutter:true,height:360,xlabel:`market ${i} output`,ylabel:'price / marginal revenue',title:`market ${i}`}));
        let info;
        v.render(()=>{
          const p=discriminationState(a2.value,b2.value,cost.value,rise.value,mode.value==='uni');
          stages.forEach((S,i)=>{
            const d=p.markets[i],q=p.q[i],price=p.p[i],end=d.a/d.b;
            const top=Math.max(d.a,p.uniform?p.uniformPrice:p.lambda);S.setView([-.06*end,1.08*end],[-.07*top,1.14*top]);S.setTitle(`market ${i+1}: P = ${fx(d.a,1)} − ${fx(d.b,2)}q`);
            S.fn(x=>d.a-d.b*x,{domain:[0,end],color:'accent',width:2.7});S.fn(x=>d.a-2*d.b*x,{domain:[0,end/2],color:'purple',width:2.4});
            if(q>1e-12){S.poly([[0,d.a],[q,price],[0,price]],{fill:'green',fillAlpha:.2,stroke:false});S.dot(q,price,{color:'gold',r:7});}
            else S.dot(0,d.a,{color:'muted',r:6,hollow:true});
            S.hline(p.uniform?p.uniformPrice:p.lambda,{color:'orange',width:2});S.vline(q,{color:'muted',dash:true});
          });
          info=p;
        });
        v.legend([['accent','demand'],['purple','marginal revenue'],['orange','optimal MC / uniform price'],['green','consumer surplus'],['gold','active outcome'],['muted','closed market’s choke point']]);
        v.readout(()=>{
          const e=i=>info.elasticity[i]===null?'undefined (no sales)':fx(info.elasticity[i],3);
          return String.raw`${info.uniform?'Uniform posted price':'Separate active prices'}: $${fx(info.p[0],3)}$ and $${fx(info.p[1],3)}$; outputs $(${fx(info.q[0],3)},${fx(info.q[1],3)})$. ${info.q.some(q=>q<1e-12)?'A zero-sales market is closed; its choke price is not a transacted separate price.':''} Elasticities $|\varepsilon_1|$: ${e(0)}; $|\varepsilon_2|$: ${e(1)}. Marginal revenues $(${fx(info.mr[0],3)},${fx(info.mr[1],3)})$; actual $MC=${fx(info.mc,3)}$. ${info.uniform?'The separate-price MR/MC and elasticity-ranking conditions do not apply to this uniform policy.':info.mc===0?'At zero marginal cost, active elasticities are one; different prices need not imply different elasticities.':'Each active marginal revenue equals common MC; a closed market satisfies the inequality.'} Separate prices: profit $${fx(info.separate.profit,3)}$, output $${fx(info.separate.Q,3)}$, total surplus $${fx(info.separate.welfare,3)}$. One price: profit $${fx(info.one.profit,3)}$, output $${fx(info.one.Q,3)}$, total surplus $${fx(info.one.welfare,3)}$.`;
        });
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
      num:'10.9',kind:'Model',name:'Monopolistic competition',
      statement:String.raw`In the standard symmetric large-group picture of monopolistic competition, differentiated products give each firm a downward-sloping perceived demand. At an interior long-run zero-profit point, profit maximization gives $MR=MC$ while zero economic profit gives $P=AC$. The demand curve is tangent to average cost. With strictly downward-sloping demand the tangency lies on the falling part of $AC$, so output is below the minimum-average-cost scale and $P>MC$.

The visualization specifies an illustrative family
$$\begin{aligned}P(q;n)&=2+40/n-q,\\C(q)&=16+2q+q^2/4.\end{aligned}$$
Here $n$ is a **continuous entry index** controlling the demand shift, rather than an exact integer count derived from consumer preferences. The interior optimum is $q=16/n$, profit is $320/n^2-16$, and the zero-profit index is $n^*=\sqrt{20}$.`,
      idea:String.raw`For each fixed perceived demand, maximize revenue less cost. A positive economic profit suggests entry; a loss suggests exit. This model assumes how that adjustment shifts demand, without supplying an entry game or a convergence law. At $n^*$, zero profit makes demand meet average cost at the chosen output, and $MR=MC$ makes their slopes equal. In this example $q^*=\sqrt{12.8}$, while minimum $AC$ occurs at $q=8$; the gap and markup remain despite zero economic profit. The model does not measure whether consumers' gain from variety offsets these distortions.`,
      caption:String.raw`Move the continuous entry index or use **zero-profit entry index** for its exact value. The left panel shows the complete nonnegative demand and marginal-revenue branches, marginal cost, the visible average-cost curve and the profit/loss rectangle. The divergent $AC$ branch as $q\to0$ continues above the window. The right panel includes the complete profit curve for n=1–8; the n=1 optimum and profit are fully in view. The capacity-gap bracket appears when chosen output is below the minimum-AC scale.`,
      deps:['micro-10.2','micro-8.8'],refs:['Shapiro, MacDonald & Greenlaw, OpenStax Principles of Microeconomics 3e §10.1: perceived demand, entry/exit and long-run efficiency'],tags:['competition','entry'],
      scope:String.raw`A specified linear perceived-demand family with quadratic variable cost, fixed cost 16 and a continuous demand-shift index n∈[1,8]. This is a diagrammatic large-group approximation, not an integer-entry equilibrium, a demand system derived from preferences or a dynamic entry mechanism.`,
      verify: false,
      links:{source:'https://openstax.org/books/principles-microeconomics-3e/pages/10-1-monopolistic-competition'},
      viz(v){
        const index=v.slider('continuous entry index $n$',1,8,2,{step:.01});
        v.button('zero-profit entry index',()=>index.set(Math.sqrt(20)));
        const A=v.stage({x:[-1,45],y:[-2,48],axes:'box',gutter:true,height:380,xlabel:'output per firm q',ylabel:'price / cost',title:'perceived demand and the zero-profit tangency'});
        const B=v.stage({x:[.6,8.4],y:[-45,340],axes:'box',gutter:true,height:380,xlabel:'continuous entry index n',ylabel:'profit per firm',title:'profit under the assumed demand shift'});
        let info;
        v.render(()=>{
          const p=entryState(index.value),xmax=Math.max(1.25*p.qMin,1.06*p.a),top=1.15*Math.max(p.a,p.averageCost,p.mc(xmax)),target=.96*top,z=target-p.c;
          const qlo=2*p.F/(z+Math.sqrt(z*z-2*p.m*p.F));
          A.setView([-.06*xmax,1.08*xmax],[-.06*top,top]);
          A.fn(q=>p.a-q,{domain:[0,p.a],color:'accent',width:2.7});A.fn(q=>p.a-2*q,{domain:[0,p.a/2],color:'purple',width:2.3});
          A.fn(p.mc,{domain:[0,xmax],color:'orange',width:2.3});A.fn(p.ac,{domain:[qlo,xmax],color:'teal',width:2.7});
          A.rect(0,Math.min(p.p,p.averageCost),p.q,Math.max(p.p,p.averageCost),{fill:p.profit>=0?'green':'red',fillAlpha:.22,stroke:false});
          A.vline(p.qMin,{color:'muted',dash:true});A.dot(p.qMin,p.ac(p.qMin),{color:'muted',r:5});A.dot(p.q,p.p,{color:'gold',r:7});
          if(p.q<p.qMin-.01)A.measure(p.q,.07*top,p.qMin,.07*top,'capacity gap',{color:'muted',size:11});
          B.hline(0,{color:'muted'});B.fn(n=>entryState(n).profit,{domain:[1,8],color:'ink',width:2.7});B.dot(p.nStar,0,{color:'green',r:6,hollow:true});B.dot(p.n,p.profit,{color:'gold',r:5});
          info={...p,qlo,xmax,top};
        });
        v.legend([['accent','perceived demand'],['purple','marginal revenue'],['orange','marginal cost'],['teal','average cost'],['green','profit / zero-profit index'],['red','loss'],['muted','minimum-AC scale'],['gold','chosen outcome']]);
        v.readout(()=>String.raw`$n=${fx(info.n,6)}$: $q=${fx(info.q,6)}$, $P=${fx(info.p,6)}$, $AC=${fx(info.averageCost,6)}$, $MC=${fx(info.marginalCost,6)}$, profit $${fx(info.profit,6)}$. Zero-profit index $n^*=\sqrt{20}=${fx(info.nStar,6)}$; current markup $(P-MC)/P=${fx((info.p-info.marginalCost)/info.p,4)}$. Minimum-AC output is $8$; current gap $${fx(Math.max(0,8-info.q),6)}$. ${info.n<info.nStar-1e-9?'Positive profit: the illustrative adjustment calls for entry.':info.n>info.nStar+1e-9?'A loss: the illustrative adjustment calls for exit.':'Zero-profit tangency; output remains below the minimum-AC scale.'}`);
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
        const B = v.stage({ x: [0.4, 4.6], y: [-12, 24], axes: 'box', gutter: true, xticks: [[1, 'firm 1'], [2, 'eq. 1'], [3, 'firm 2'], [4, 'eq. 2']], ylabel: 'profit', height: 420, title: 'profits', weight: 0.6, minWidth: 230 });
        v.legend([['accent', 'firm 1 reaction line $R_1$'], ['orange', 'firm 2 reaction line $R_2$'], ['purple', 'iso-profit curves of firm 1'], ['green', 'Cournot equilibrium', { dot: true }], ['gold', 'test point', { dot: true }]]);
        const H = s.handle(9, 2, { color: 'gold', r: 9, label: '(q₁, q₂)', labelPos: 'ne', constrain: { x: [0.05, 11.9], y: [0.05, 11.9] } });
        let st = {};
        v.render(() => {
          const c1 = c1S.value, c2 = c2S.value, R1 = (q2) => Math.max(0, (a - c1 - b * q2) / (2 * b)), R2 = (q1) => Math.max(0, (a - c2 - b * q1) / (2 * b));
          const [e1, e2] = v.M.solve([[2 * b, b], [b, 2 * b]], [a - c1, a - c2]);
          const pi1 = (q1, q2) => q1 * (a - b * (q1 + q2) - c1), pi2 = (q1, q2) => q2 * (a - b * (q1 + q2) - c2);
          const q1 = H.x, q2 = H.y;
          s.clip(() => s.contour((x, y) => pi1(x, y), [pi1(q1, q2), pi1(e1, e2)], { color: 'purple', width: 1.8, res: 100 }));
          s.line(R1(0), 0, 0, a - c1, { color: 'accent', width: 2.6 }); s.line(0, R2(0), a - c2, 0, { color: 'orange', width: 2.6 });
          s.arrow(q1, q2, R1(q2), q2, { color: 'accent', width: 2 }); s.arrow(q1, q2, q1, R2(q1), { color: 'orange', width: 2 });
          s.dot(e1, e2, { r: 8, color: 'green' });
          tag(s, 'R₁', R1(10), 10, 'accent', { dx: 14 }); tag(s, 'R₂', 0.6, R2(0.6), 'orange', { dy: -14 });
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
      num:'10.12',kind:'Proposition',name:'Stability of Cournot adjustment',
      statement:String.raw`For linear inverse demand, constant equal costs and nonnegative output, the naive quantity reply is
$$R_i(q_{-i})=\max\left\{0,\frac{a-c-b\sum_{j\ne i}q_j}{2b}\right\}.$$
Under simultaneous updates the duopoly map is a contraction with factor at most $1/2$ in the maximum norm. Near an interior symmetric equilibrium with $n$ firms, its Jacobian has eigenvalues $1/2$ for redistributions whose total is zero, and $-(n-1)/2$ for the common-output direction. Thus the interior equilibrium is locally asymptotically stable for n=2, neutral in the common direction for n=3, and unstable in that direction for n≥4.

These are local interior conclusions. Exact zero-total-deviation starts can converge even for n≥3. Once nonnegative-output constraints bind, the linear multiplier no longer applies; outputs are bounded after the first update. **Cyclic sequential** exact replies converge to the unique equilibrium for this specified linear game, including the nonnegative constraints.`,
      idea:String.raw`While every reply is strictly positive, deviations obey $x_i^{t+1}=-\frac12\sum_{j\ne i}x_j^t$. Summing gives the common-output multiplier, and a zero-sum vector is instead multiplied by $1/2$. For duopoly, max(0,·) preserves the global Lipschitz bound. For sequential updates write $s=(a-c)/b$ and minimize
$$\begin{aligned}f(q)={}&\tfrac12\left(\sum_iq_i\right)^2+\tfrac12\sum_iq_i^2\\&-s\sum_iq_i,\qquad q_i\ge0.\end{aligned}$$
An exact reply minimizes one coordinate of f. Its Hessian is $I+\mathbf1\mathbf1^T$, which is positive definite, so f has bounded sublevel sets and a unique minimum. Cyclic coordinate minimization converges to that minimum. This is a property of the specified adjustment rule and costs; a finite plotted trajectory is not itself a proof of convergence.`,
      caption:String.raw`Set n and the initial quantities of firm 1 and the other firms. Compare simultaneous updates with one complete cyclic sweep per round. The left panel shows the first two quantities (a projection when n>2), including intermediate sequential updates. The right panel contains the full total-output trajectory for 24 rounds, including every actual start. **Equilibrium start** checks a fixed point; **balanced perturbation** gives zero aggregate deviation and exposes the stable redistribution direction. The readout uses the full vector's distance from equilibrium and reports a multiplier only for a strictly interior transition with nonzero aggregate deviation.`,
      deps:['micro-10.10','pma-9.23'],refs:['Hommes, Ochea & Tuinstra (2018), Dynamic Games and Applications8:822–843, §2 and Appendix proof of Proposition1','P. Tseng (2001), JOTA109:475–494, §2, Lemma3.1 and Theorem4.1(a): cyclic coordinate minimization'],tags:['oligopoly','stability'],
      scope:String.raw`A naive best-reply learning model with a=12,b=1,c=2, finite n and nonnegative quantities. Simultaneous local multipliers apply only in the strictly positive interior. Sequential means a fixed cyclic order with exact replies; it is not a claim about arbitrary asynchronous, delayed or stochastic learning. The plot shows24 rounds, not empirical adjustment.`,
      verify: false,
      links:{source:'https://link.springer.com/article/10.1007/s13235-018-0238-x'},
      viz(v){
        const mode=v.select('adjustment',[{value:'sim',label:'simultaneous'},{value:'seq',label:'cyclic sequential'}],'sim');
        const count=v.slider('number of firms $n$',2,6,2,{int:true}),first=v.slider('initial output of firm 1',0,10,8,{step:.05}),others=v.slider('initial output of every other firm',0,10,1,{step:.05});
        v.button('equilibrium start',()=>{const q=10/(count.value+1);first.set(q);others.set(q);});
        v.button('balanced perturbation',()=>{const q=10/(count.value+1);first.set(q+.5);others.set(q-.5/(count.value-1));});
        const A=v.stage({x:[-.65,10.65],y:[-.65,10.65],axes:'box',gutter:true,height:380,xlabel:'firm 1 output q₁',ylabel:'firm 2 output q₂',title:'first two quantities: full projected path'});
        const B=v.stage({x:[-1,25],y:[-4,70],axes:'box',gutter:true,height:380,xlabel:'complete update round t',ylabel:'total output Qₜ',title:'full trajectory and equilibrium total'});
        let info;
        v.render(()=>{
          const p=cournotAdjustment(count.value,first.value,others.value,mode.value==='seq');
          if(p.n===2){A.path([[5,0],[0,10]],{color:'orange',width:2});A.path([[0,5],[10,0]],{color:'orange',width:2});}
          const full=p.sequential?[p.states[0],...p.updates]:p.states;
          A.path(full.map(q=>q.slice(0,2)),{color:'accent',width:2});A.dots(p.states.map(q=>q.slice(0,2)),{color:'accent',r:3});
          A.dot(p.equilibrium,p.equilibrium,{color:'green',r:8,hollow:true});A.dot(p.first,p.others,{color:'gold',r:5});
          const top=Math.max(1,p.totalEquilibrium,...p.totals);B.setView([-1,25],[-.08*top,1.14*top]);
          B.hline(p.totalEquilibrium,{color:'green',width:2});B.path(p.totals.map((Q,t)=>[t,Q]),{color:'accent',width:2.4});B.dots(p.totals.map((Q,t)=>[t,Q]),{color:'accent',r:3});
          info=p;
        });
        v.legend([['accent','trajectory / complete-round points'],['orange','duopoly replies'],['green','equilibrium'],['gold','initial quantities']]);
        v.readout(()=>String.raw`$n=${info.n}$: equilibrium output per firm $${fx(info.equilibrium,6)}$, total $${fx(info.totalEquilibrium,6)}$. Initial total $${fx(info.totals[0],6)}$; after 24 rounds total $${fx(info.totals.at(-1),6)}$, full-vector distance $${fx(info.norms.at(-1),6)}$. ${info.sequential?'Each round is one exact cyclic sweep; convergence follows from the strictly convex potential, not from the finite trace.':info.ratio===null?'No valid nonzero interior total-deviation ratio in this trace.':`Interior transition ${info.ratioAt}→${info.ratioAt+1}: measured total-deviation factor $${fx(info.ratio,6)}$, predicted $${fx(info.theory,6)}$.`} ${info.clipped.some(Boolean)?'At least one reply meets the zero-output boundary; the interior multiplier does not describe those transitions.':'All displayed transitions stay strictly interior.'}`);
      },
    },

  ],
};
