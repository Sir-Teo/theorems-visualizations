// Microeconomics — Chapter 10: Market power: monopoly and oligopoly — items 10.13–10.17
import { clamp, fx, bisect, argmax, plateText, bar, lin, mstage, tag, integ, tween } from './ch10.shared.js';
import {stackelbergState,bertrandProfit,bertrandState,differentiatedState,capacityProfit,capacityState} from './source-audit-oligopoly.js';

export default {
  collection: 'micro',
  chapter: 10,
  items: [
    // ------------------------------------------------------------------ 10.13
    {
      num:'10.13',kind:'Model',name:'Stackelberg leadership',
      statement:String.raw`A quantity leader commits first. The follower observes that quantity and chooses its profit-maximizing reply. With inverse demand $P=\max\{0,a-b(q_1+q_2)\}$, $b>0$, and constant marginal costs, the follower's reply is
$$R_2(q_1)=\max\left\{0,\frac{a-c_2-bq_1}{2b}\right\}.$$
The leader maximizes $q_1[P(q_1+R_2(q_1))-c_1]$. If both firms produce positive quantities at the optimum, backward induction gives
$$q_1^S=\frac{a-2c_1+c_2}{2b},\qquad q_2^S=\frac{a-3c_2+2c_1}{4b}.$$
These formulas require the interior conditions. In the displayed range $a=12$, $b=1$, $0\le c_i\le5$, the exact leader output is $\min\{(a-2c_1+c_2)/(2b),(a-c_2)/b\}$: when the unconstrained formula passes the follower-exit point, the optimum is that corner.`,
      idea:String.raw`Solve the follower's concave quantity problem after every possible leader choice, including zero output. Substitution gives a quadratic leader-profit branch while the follower is active and another after it exits. Maximize each branch on its own interval and compare with the kink. A smooth interior optimum is a tangency; an exit optimum need not be. The simultaneous Cournot outcome is feasible on the follower's reply, so the committed leader can earn at least its Cournot profit. The usual output/price comparison follows for the stated parameter range; timing and credible quantity commitment are part of the game.`,
      caption:String.raw`Move the costs and the leader's chosen quantity. The left panel shows both quantity replies and the actual follower response, including its zero-output segment. Purple is the Stackelberg optimum, green the simultaneous Cournot outcome and gold your choice. The right panel plots the leader's complete profit along the follower's reply, including negative profits at excessive output. The **go to the optimum** button selects the exact interior or exit solution.`,
      deps:['micro-10.10'],see:['game-1.3'],
      refs:['MIT 14.12, Chapter 9 §9.5: backward induction in Stackelberg duopoly'],tags:['oligopoly'],
      scope:String.raw`A two-firm quantity game with complete information, an observed and irreversible leader choice, linear demand and constant marginal costs. The visualization uses a=12, b=1 and costs 0–5; its Cournot comparison is interior throughout this range. No empirical estimate or game with output revision is inferred.`,
      verify: false,
      links:{source:'https://ocw.mit.edu/courses/14-12-economic-applications-of-game-theory-fall-2025/mit14_12f12_chapter9_f12.pdf'},
      viz(v){
        const c1=v.slider('leader cost $c_1$',0,5,2,{step:.05}),c2=v.slider('follower cost $c_2$',0,5,2,{step:.05});
        const choice=v.slider('chosen leader output $q_1$',0,12,2,{step:.05});
        const A=v.stage({x:[-.6,12.6],y:[-.6,12.6],axes:'box',gutter:true,equal:true,height:380,xlabel:'leader output q₁',ylabel:'follower output q₂',title:'quantity replies and commitment'});
        const B=v.stage({x:[-.6,12.6],y:[-65,40],axes:'box',gutter:true,height:380,xlabel:'leader output q₁',ylabel:'leader profit',title:'profit along the follower’s reply'});
        v.button('go to the optimum',()=>choice.set(stackelbergState(c1.value,c2.value).leader));
        let info;
        v.render(()=>{
          const p=stackelbergState(c1.value,c2.value,choice.value);
          A.path([[0,(12-c2.value)/2],[p.exit,0],[12,0]],{color:'orange',width:2.8});
          A.path([[(12-c1.value)/2,0],[0,12-c1.value],[0,12]],{color:'accent',width:1.8});
          A.dot(p.cournot1,p.cournot2,{color:'green',r:7});A.dot(p.leader,p.follower,{color:'purple',r:7});A.dot(p.q,p.reply,{color:'gold',r:5});
          A.vline(p.q,{color:'gold',dash:true});
          const lo=Math.min(0,p.profit(12)),hi=Math.max(1,p.leaderProfit),pad=.1*(hi-lo);
          B.setView([-.6,12.6],[lo-pad,hi+pad]);B.hline(0,{color:'muted'});
          B.fn(p.profit,{domain:[0,12],color:'ink',width:2.7});B.hline(p.cournotProfit1,{color:'green',dash:true});
          B.dot(p.leader,p.leaderProfit,{color:'purple',r:7});B.dot(p.q,p.chosenProfit,{color:'gold',r:5});
          info=p;
        });
        v.legend([['accent','leader quantity reply'],['orange','follower quantity reply'],['purple','Stackelberg optimum'],['green','Cournot'],['gold','chosen leader output']]);
        v.readout(()=>String.raw`Your $q_1=${fx(info.q,3)}$ gives follower output $${fx(info.reply,3)}$ and leader profit $${fx(info.chosenProfit,3)}$. Exact Stackelberg: outputs $(${fx(info.leader,3)},${fx(info.follower,3)})$, price $${fx(info.price,3)}$, profits $(${fx(info.leaderProfit,3)},${fx(info.followerProfit,3)})$. ${info.corner?'Follower-exit corner (zero follower output).':'Interior solution.'} Cournot: outputs $(${fx(info.cournot1,3)},${fx(info.cournot2,3)})$, price $${fx(info.cournotPrice,3)}$. Leader’s commitment gain $${fx(info.leaderProfit-info.cournotProfit1,3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 10.14
    {
      num:'10.14',kind:'Model',name:'Bertrand competition',
      statement:String.raw`Two firms simultaneously choose nonnegative continuous prices for an identical good. They have the same constant marginal cost $c$, no fixed costs and enough capacity to serve the market. Buyers choose the lower price and split equally on a tie. For $D(p)=\max\{0,10-p\}$ and $0<c<10$,
$$\pi_i=(p_i-c)D(p_i)\begin{cases}1&p_i<p_j,\\1/2&p_i=p_j,\\0&p_i>p_j.\end{cases}$$
The unique pure-strategy Nash equilibrium is $(p_1,p_2)=(c,c)$, with zero profits. If a rival price $r$ lies in $(c,p^m]$, where $p^m=(10+c)/2$, **no best reply is attained**: prices approaching $r$ from below approach a profit supremum, but tying earns only half the market. “Just below” describes a limit, not a maximizing continuous price.`,
      idea:String.raw`At a common price above cost with positive demand, a sufficiently small cut nearly doubles sales without losing much margin. Unequal prices above cost also allow a profitable change, and prices with zero demand cannot be an equilibrium when positive profit is available. At $(c,c)$ a lower price loses money, while any higher price loses demand and earns zero. This is a static equilibrium argument. A fixed finite undercut need not improve the mover's payoff near cost, so the displayed path is an illustration rather than a best-response or convergence theorem. If the rival charges above the monopoly price, the monopoly price can instead be an attained best reply.`,
      caption:String.raw`Use **path progress** to inspect a finite sequence of alternating $\delta$ cuts, clipped at cost. The left panel shows its complete path from the monopoly-price tie to $(c,c)$. The right panel gives the next mover's complete payoff against its current rival: the open upper circle is the left-hand profit limit, the filled middle circle is the tie, and prices above the rival earn zero. Red marks the illustrative finite cut. At the terminal point the payoff has no positive jump and no profitable deviation.`,
      deps:['micro-10.2'],see:['game-1.2'],
      refs:['MIT 14.12, Chapter 7 §§7.2–7.2.1: the continuous-price Bertrand game and proof'],tags:['oligopoly'],
      scope:String.raw`A one-shot homogeneous-good game with identical constant costs, continuous prices, equal tie splitting, full information and unlimited capacity. Demand is max(0,10−p), c is 1–5 and the plotted path uses a chosen finite decrement; the path does not model optimizing adjustment.`,
      verify: false,
      links:{source:'https://ocw.mit.edu/courses/14-12-economic-applications-of-game-theory-fall-2025/mit14_12f12_chapter7_f12.pdf'},
      viz(v){
        const cost=v.slider('marginal cost $c$',1,5,2,{step:.05}),delta=v.slider(String.raw`illustrative cut $\delta$`,.05,1,.25,{step:.05}),progress=v.slider('path progress',0,1,0,{step:.001});
        v.button('start',()=>progress.set(0));v.button('finish',()=>progress.set(1));
        const A=v.stage({x:[-.5,10.5],y:[-.5,10.5],axes:'box',gutter:true,equal:true,height:380,xlabel:'firm 1 price p₁',ylabel:'firm 2 price p₂',title:'illustrative finite-cut path'});
        const B=v.stage({x:[-.5,10.5],y:[-55,25],axes:'box',gutter:true,height:380,xlabel:'own price',ylabel:'next mover’s profit',title:'a discontinuous payoff, not an attained undercut optimum'});
        let info;
        v.render(()=>{
          const p=bertrandState(cost.value,delta.value,progress.value),r=p.rival,c=p.c;
          A.line(0,0,10,10,{color:'muted',dash:true});A.path(p.path,{color:'faint',width:1.6});A.path(p.path.slice(0,p.k+1),{color:'accent',width:2.5});
          A.dot(c,c,{color:'green',r:8,hollow:true});A.dot(...p.cur,{color:'gold',r:5});
          const low=-10*c,high=(10-c)**2/4,pad=.1*(high-low);
          B.setView([-.5,10.5],[low-pad,high+pad]);B.hline(0,{color:'muted'});B.vline(r,{color:'faint',dash:true});
          B.fn(x=>(x-c)*Math.max(0,10-x),{domain:[0,r],color:'accent',width:2.5});B.line(r,0,10,0,{color:'accent',width:2.5});
          if(r>c){B.dot(r,p.supremum,{color:'accent',r:5,hollow:true});B.dot(r,0,{color:'accent',r:5,hollow:true});}
          B.dot(r,p.tieProfit,{color:'accent',r:4});B.dot(p.candidate,p.candidateProfit,{color:'red',r:6});B.dot(p.cur[p.mover],bertrandProfit(p.cur[p.mover],r,c),{color:'gold',r:4});
          info=p;
        });
        v.legend([['accent','path / own-price payoff'],['green','equilibrium (c,c)'],['gold','current prices / payoff'],['red','finite δ cut (illustration)']]);
        v.readout(()=>String.raw`Step ${info.k} of ${info.last}: prices $(${fx(info.cur[0],3)},${fx(info.cur[1],3)})$, profits $(${fx(info.profit1,3)},${fx(info.profit2,3)})$. Rival price $r=${fx(info.rival,3)}$; illustrative cut $${fx(info.candidate,3)}$ earns $${fx(info.candidateProfit,3)}$. ${info.done?'At (c,c), every unilateral deviation earns at most zero.':info.rival===info.c?'The rival is at cost: every own price at or above cost earns zero. The final illustrative cut selects c.':`The left-hand profit supremum is $${fx(info.supremum,3)}$; no continuous price attains it while this rival price lies above cost and at or below the monopoly price.`}`);
      },
    },
    // ------------------------------------------------------------------ 10.15
    {
      num:'10.15',kind:'Paradox',name:'Bertrand paradox',
      statement:String.raw`The zero-markup outcome in homogeneous, unlimited-capacity price competition depends on its assumptions. Two explicit alternative games show how the prediction changes.

**Differentiation.** For $p_i=a-q_i-sq_j$, equal marginal cost $c<a$ and $0\le s<1$, the symmetric interior Bertrand and Cournot prices are
$$p_B=a-\frac{a-c}{2-s},\qquad p_C=a-\frac{(1+s)(a-c)}{2+s}.$$
Their gap is $(a-c)s^2/(4-s^2)\ge0$. At $s=1$ the differentiated direct-demand system is singular; the plotted endpoint is its **homogeneous limit**, with $p_B\to c$.

**Capacity.** With $D(p)=\max\{0,a-p\}$, equal fixed capacities $k$, constant production cost $c$, and efficient rationing, the symmetric pure equilibrium is $p=a-2k$ for $k\le(a-c)/3$, and $p=c$ for $k\ge a-c$. Between these ranges no pure-strategy price equilibrium exists in this game. Capacity limits therefore do not always raise the equilibrium price.`,
      idea:String.raw`In the differentiated interior, inversion gives $q_i=[(1-s)a-p_i+sp_j]/(1-s^2)$. Profit maximization gives the price reply $p_i=[(1-s)a+c+sp_j]/2$; solving symmetrically yields $p_B$. Quantity maximization instead gives $q_C=(a-c)/(2+s)$. Positive markups survive for every $s<1$.

For efficient rationing the lower-price firm serves the highest-valuation customers first. A higher-price firm then sells $\min\{k,\max(0,D(p)-k)\}$. The only symmetric equilibrium candidate is $p_0=\max\{c,a-2k\}$. A lower price cannot improve on that candidate. Above it, residual profit is maximized at $(a+c-k)/2$ when this lies above $p_0$. Comparing this maximum with tie profit gives the small-capacity boundary $(a-c)/3$; when $k\ge D(c)$ the rival alone can satisfy demand at cost and the zero-markup equilibrium returns. The usual deviation arguments exclude asymmetric pure-price equilibria as well.`,
      caption:String.raw`Choose differentiation or capacity limits. Differentiation compares the two symmetric equilibrium prices; the second panel shows each firm's quantity in each game. The $s=1$ endpoint is labelled as a limit. Capacity mode plots the two actual equilibrium ranges, leaving the intermediate range without an equilibrium-price marker. Its second panel shows the **complete** unilateral profit function against the candidate price, including undercuts and higher-price residual demand. The boundary buttons set the exact small/large-capacity thresholds. These are model comparisons with a=10 and c=2.`,
      deps:['micro-10.14','micro-10.10'],
      refs:['M. Yildiz, MIT 14.126 lecture notes, Example 5.5 (affine differentiated price competition)','Levitan & Shubik, Price Duopoly and Capacity Constraints, Cowles Discussion Paper 287 (1970), model and pure-equilibrium regimes'],tags:['oligopoly'],
      scope:String.raw`Two separate symmetric linear duopoly games with a=10 and c=2. Differentiated equilibrium formulas apply in the positive-demand interior for s<1; s=1 is a limit. Capacity is exogenous, output is produced to order and equal-price demand is split equally; efficient rationing determines residual demand. No capacity-investment stage, mixed-strategy distribution, price-cycle dynamics or empirical industry inference is computed.`,
      verify: false,
      links:{source:'https://cowles.yale.edu/sites/default/files/2022-08/d0287.pdf'},
      viz(v){
        const mode=v.select('relax',[{value:'diff',label:'product differentiation'},{value:'cap',label:'capacity limits'}],'diff');
        const sub=v.slider('substitutability $s$',0,1,.5,{step:.01}),cap=v.slider('capacity $k$ of each firm',.5,9,2,{step:.05});
        v.button('small-capacity boundary',()=>{mode.set('cap');cap.set(8/3);});v.button('large-capacity boundary',()=>{mode.set('cap');cap.set(8);});
        const A=v.stage({x:[-.06,1.06],y:[1,10],axes:'box',gutter:true,height:380,xlabel:'substitutability s',ylabel:'equilibrium price',title:'prices in the two games'});
        const B=v.stage({x:[-.3,2.3],y:[-.8,4.8],axes:'box',gutter:true,height:380,xlabel:'competition game',ylabel:'output per firm',title:'symmetric quantities'});
        let info;
        v.render(()=>{
          const diff=mode.value==='diff';sub.el.hidden=!diff;cap.el.hidden=diff;
          if(diff){
            const p=differentiatedState(sub.value);A.setView([-.06,1.06],[1.5,7]);A.setLabels('substitutability s','equilibrium price');A.setTitle('symmetric equilibrium prices');
            A.fn(x=>differentiatedState(x).pB,{domain:[0,1],color:'ink',width:2.7});A.fn(x=>differentiatedState(x).pC,{domain:[0,1],color:'purple',width:2.7});A.hline(2,{color:'orange',dash:true});
            A.dot(p.s,p.pC,{color:'purple',r:6});A.dot(p.s,p.pB,{color:'gold',r:5});
            B.setView([-.3,2.3],[-.8,4.8]);B.setLabels('competition game','output per firm');B.setTitle(p.homogeneousLimit?'quantities at the homogeneous limit':'symmetric quantities');B.setTicks([[.5,'Bertrand'],[1.5,'Cournot']]);
            B.rect(.18,0,.82,p.qB,{fill:'ink',fillAlpha:.3,color:'ink'});B.rect(1.18,0,1.82,p.qC,{fill:'purple',fillAlpha:.3,color:'purple'});
            info={diff,...p};
          }else{
            const p=capacityState(cap.value);A.setView([0,9.5],[1,10]);A.setLabels('capacity k per firm','pure-equilibrium price');A.setTitle('pure equilibrium ranges');
            A.rect(8/3,1,8,10,{fill:'red',fillAlpha:.07,stroke:false});A.path([[.5,9],[8/3,14/3]],{color:'ink',width:2.7});A.line(8,2,9,2,{color:'ink',width:2.7});A.vline(p.k,{color:'gold',dash:true});
            if(p.equilibrium)A.dot(p.k,p.candidate,{color:'gold',r:6});
            const bottom=-2*p.k,pad=.1*(10-bottom);B.setView([-.5,10.5],[bottom-pad,10+pad]);B.setLabels('own price p','own profit');B.setTitle('complete deviation payoff against the candidate');B.setTicks(null);
            B.fn(x=>(x-2)*Math.min(p.k,10-x),{domain:[0,p.candidate],color:'accent',width:2.5});
            B.fn(x=>(x-2)*Math.min(p.k,Math.max(0,10-x-p.k)),{domain:[p.candidate,10],color:'accent',width:2.5});
            B.hline(p.own,{color:'green',dash:true});B.dot(p.candidate,p.own,{color:'green',r:6});
            if(p.gain>0)B.dot(p.upwardPrice,p.upward,{color:'red',r:6});
            info={diff,...p};
          }
        });
        v.legend([['ink','Bertrand price / quantity / pure price'],['purple','Cournot price / quantity'],['orange','marginal cost'],['gold','selected setting'],['accent','unilateral profit'],['green','candidate tie profit'],['red','no pure equilibrium / profitable deviation']]);
        v.readout(()=>info.diff?String.raw`$s=${fx(info.s,3)}$: Bertrand $(p,q)=(${fx(info.pB,3)},${fx(info.qB,3)})$, Cournot $(p,q)=(${fx(info.pC,3)},${fx(info.qC,3)})$. Price gap $${fx(info.pC-info.pB,3)}$; per-firm profits $${fx(info.profitB,3)}$ and $${fx(info.profitC,3)}$. ${info.homogeneousLimit?'Homogeneous limit; the differentiated direct-demand formula cannot be evaluated at s=1.':'Both differentiated equilibria have positive quantities.'}`:String.raw`$k=${fx(info.k,6)}$: candidate $p_0=${fx(info.candidate,6)}$, tie profit $${fx(info.own,6)}$. Best higher-price payoff (or boundary supremum) $${fx(info.upward,6)}$ at $p=${fx(info.upwardPrice,6)}$; gain $${fx(info.gain,6)}$. ${info.equilibrium?'No profitable unilateral deviation: pure equilibrium.':'A higher-price deviation pays: no pure price equilibrium in this capacity range.'}`);
      },
    },
    // ------------------------------------------------------------------ 10.16
    {
      num: '10.16', kind: 'Concept', name: 'Collusion and cartel instability',
      statement: String.raw`A **cartel** of $n$ identical firms that jointly maximize profit would produce the monopoly output $Q^m$, each firm $Q^m/n$, and earn $\pi^M$ each. But each member does better by **cheating**: given that the others hold to their quotas, its best reply is to produce more, earning $\pi^D > \pi^M$, so the agreement is not a Nash equilibrium of the one-shot quantity game, which has the lower Cournot profit $\pi^N$. In **repeated** play, firms can sustain the cartel with the threat of reverting to Cournot forever after a deviation (a trigger strategy) if they value the future enough:
$$\frac{\pi^M}{1-\delta} \;\ge\; \pi^D + \frac{\delta\,\pi^N}{1-\delta} \iff \delta \;\ge\; \delta^* = \frac{\pi^D - \pi^M}{\pi^D - \pi^N}.$$
With linear demand and $n = 2$, $\delta^* = 9/17 \approx 0.53$; $\delta^*$ rises with $n$, so collusion is harder to sustain among many firms.`,
      idea: String.raw`The joint-profit-maximizing point lies on the diagonal below the Cournot point (less total output), where each firm's marginal revenue exceeds its marginal cost: at the cartel quota, one more unit earns more than it costs because the price fall it causes is borne partly by the rivals. The one-period gain from cheating is $\pi^D - \pi^M$; the loss is the stream of lower profits $\pi^M - \pi^N$ in every later period, discounted by $\delta$. Comparing them gives the threshold. An agreement that firms cannot enforce in court must be self-enforcing in this way, which is the content of the folk theorem (game-5.3 for the repeated-game machinery).`,
      caption: String.raw`The plane shows firm $i$'s output $q_i$ against the total output $Q_{-i}$ of its rivals. Purple curves: firm $i$'s iso-profit curves through the cartel point (grey), the Cournot point (green) and the best deviation (red). Slide the **number of firms** and the **discount factor** $\delta$: the red point (cheating) always has higher profit than the grey one, but the right panel plots the present value of keeping the cartel minus that of cheating once and being punished by Cournot play for ever, which is positive exactly when $\delta \ge \delta^*$.`,
      deps: ['micro-10.10'],
      see: ['game-1.4', 'game-5.3'],
      refs: ['Varian Ch. 28', 'Mankiw Ch. 17'], tags: ['oligopoly', 'cartels'],
      credit: 'G. J. Stigler, A Theory of Oligopoly, Journal of Political Economy 72 (1): 44–61, 1964 (secret price cutting as the cartel\'s central problem)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cartel' },
      viz(v) {
        const nS = v.slider('number of firms $n$', 2, 10, 2, { int: true });
        const dS = v.slider('discount factor $\\delta$', 0, 0.99, 0.6, { step: 0.01 });
        const a = 12, b = 1, c = 2;
        const s = v.stage({ x: [0, 5], y: [0, 6], axes: 'box', gutter: true, xlabel: 'own output $q_i$', ylabel: 'rivals\' total output $Q_{-i}$', height: 400, title: 'one firm against its rivals' });
        const G = v.stage({ x: [0, 1], y: [0, 100], axes: 'box', gutter: true, xlabel: 'discount factor $\\delta$', ylabel: 'value of keeping the cartel − value of cheating', height: 400, title: 'cooperate or cheat?', weight: 0.8, minWidth: 250 });
        v.legend([['muted', 'cartel point', { dot: true }], ['green', 'Cournot point', { dot: true }], ['red', 'best cheating output', { dot: true }], ['accent', 'gain from keeping the cartel (present value)']]);
        let st = {};
        v.render(() => {
          const n = nS.value, dl = dS.value, Qm = (a - c) / (2 * b), qm = Qm / n, qn = (a - c) / ((n + 1) * b);
          const pi = (q, Qo) => q * (a - b * (q + Qo) - c);
          const Qo = (n - 1) * qm, qd = Math.max(0, (a - c - b * Qo) / (2 * b));
          const piM = pi(qm, Qo), piN = pi(qn, (n - 1) * qn), piD = pi(qd, Qo), dstar = (piD - piM) / (piD - piN);
          s.clip(() => s.contour((x, y) => pi(x, y), [piM, piN, piD], { color: 'purple', width: 1.8, res: 100 }));
          s.dot(qm, Qo, { r: 8, color: 'muted' }); s.dot(qn, (n - 1) * qn, { r: 8, color: 'green' }); s.dot(qd, Qo, { r: 8, color: 'red' });
          tag(s, 'cartel', qm, Qo, 'muted', { dy: 18 }); tag(s, 'Cournot', qn, (n - 1) * qn, 'green', { dy: -16, dx: 24 }); tag(s, 'cheat', qd, Qo, 'red', { dy: -16 });
          const Vc = (d) => piM / (1 - d), Vd = (d) => piD + (d * piN) / (1 - d);
          const diff = (d) => Vc(d) - Vd(d), top = Math.max(1, diff(0.95) * 1.1), bot = Math.min(-1, diff(0) * 1.2);
          G.setView([0, 1], [bot, top]);
          G.hline(0, { color: 'muted', width: 1.2 }); G.fn(diff, { domain: [0, 0.95], color: 'accent', width: 2.6 });
          G.vline(dstar, { color: 'green', width: 1.8, dash: [4, 3] }); G.dot(dl, diff(dl), { r: 7, color: diff(dl) >= 0 ? 'green' : 'red' });
          tag(G, `$\\delta^* = ${fx(dstar, 3)}$`, dstar, 0, 'green', { dy: -16, dx: 30 });
          st = { n, dl, piM, piN, piD, dstar, Vc: Vc(dl), Vd: Vd(dl), qm, qn, qd, suck: n === 2 ? pi(qm, qd) : null };
        });
        v.readout(() => `Per firm: cartel $${fx(st.piM)}$ (output $${fx(st.qm)}$), Cournot $${fx(st.piN)}$ (output $${fx(st.qn)}$), best cheat $${fx(st.piD)}$ (output $${fx(st.qd)}$).${st.suck !== null ? ` The cheated partner gets $${fx(st.suck)}$.` : ''}\nCritical $\\delta^* = (\\pi^D - \\pi^M)/(\\pi^D - \\pi^N) = ${fx(st.dstar, 3)}$ (for $n = 2$: $9/17 = ${fx(9 / 17, 3)}$). At $\\delta = ${fx(st.dl)}$: keep $${fx(st.Vc)}$ against cheat $${fx(st.Vd)}$, so the cartel is ${st.dl >= st.dstar ? 'self-enforcing' : 'not self-enforcing'}.`);
      },
    },
    // ------------------------------------------------------------------ 10.17
    {
      num: '10.17', kind: 'Model', name: 'Hotelling’s linear city',
      statement: String.raw`Customers are spread uniformly along a street $[0, 1]$ and each buys one unit from the seller with the lowest delivered cost: price plus a transport cost that grows with distance. Two sellers choose where to locate. With **prices fixed** (and equal) the customers split at the midpoint $(a + b)/2$ between the sellers at $a \le b$, so each seller gains by moving towards the other, and the equilibrium has both at the centre: **minimum differentiation** (Hotelling's principle). When sellers also **compete in price** with transport cost $t(x - \text{location})^2$, equilibrium prices are $p_A = c + t(b-a)(2 + a + b)/3$ and $p_B = c + t(b-a)(4 - a - b)/3$ and the profit of the left seller is $t(b-a)(2 + a + b)^2/18$, which **falls** as it moves towards its rival: the sellers locate at the **opposite ends** of the street (maximum differentiation), because proximity triggers price competition (10.14).`,
      idea: String.raw`With fixed prices moving a little toward the rival captures customers (the indifferent customer moves toward the rival) at no price cost, so there is nothing to lose until the sellers coincide. With price competition there are two opposing forces: moving closer takes market share but makes the two products closer substitutes, so prices fall, as in Bertrand competition (10.14): at equal locations the equilibrium price is $c$ with zero profit. The price effect wins for every location pair, so profit is largest at the extreme positions. Hotelling's original (1929) analysis used linear transport costs, for which d'Aspremont, Gabszewicz and Thisse showed that no price equilibrium exists when sellers are close, undermining the principle; the quadratic cost used here restores existence.`,
      caption: String.raw`**Drag the two sellers** along the street. Mode **fixed prices**: the customers left of the midpoint go to the left seller (blue), the rest to the right one (orange); the lower panel plots the left seller's customers against its own location, which is largest at the centre. Mode **price competition**: the equilibrium prices of the two sellers (computed for the positions chosen) and shares are drawn, and the lower panel shows the left seller's profit, which is highest at the left end. The readout says which way it would like to move.`,
      deps: ['micro-10.14'],
      refs: ['Varian Ch. 26'], tags: ['oligopoly', 'differentiation'],
      credit: 'H. Hotelling, Stability in Competition, Economic Journal 39 (153): 41–57, 1929; C. d\'Aspremont, J. J. Gabszewicz & J.-F. Thisse, On Hotelling\'s "Stability in Competition", Econometrica 47 (5): 1145–1150, 1979',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hotelling%27s_law' },
      viz(v) {
        const mode = v.select('model', [{ value: 'fixed', label: 'fixed prices' }, { value: 'price', label: 'price competition' }], 'fixed');
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, title: 'the street', full: true });
        const G = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'location of the left seller', ylabel: 'left seller\'s payoff', height: 300, title: 'what the left seller gains by moving', full: true });
        v.legend([['accent', 'left seller and its customers'], ['orange', 'right seller and its customers'], ['gold', 'indifferent customer', { dot: true }]]);
        const HA = s.handle(0.25, 0.55, { color: 'accent', r: 10, label: 'A', labelPos: 'n', constrain: 'x' });
        const HB = s.handle(0.75, 0.55, { color: 'orange', r: 10, label: 'B', labelPos: 'n', constrain: 'x' });
        const t = 1, c = 0;
        let st = {};
        v.render(() => {
          let a = clamp(HA.x, 0.01, 0.97), b = clamp(HB.x, 0.03, 0.99);
          if (a > b - 0.02) { if (HA.dragging) a = b - 0.02; else b = a + 0.02; }
          HA.set(a, 0.55); HB.set(b, 0.55);
          const fixed = mode.value === 'fixed';
          const pA = fixed ? 1 : c + (t * (b - a) * (2 + a + b)) / 3, pB = fixed ? 1 : c + (t * (b - a) * (4 - a - b)) / 3;
          const xh = (a + b) / 2 + (pB - pA) / (2 * t * (b - a) * (fixed ? Infinity : 1));
          const x_ = fixed ? (a + b) / 2 : xh;
          s.rect(0, 0.08, x_, 0.3, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 1 }); s.rect(x_, 0.08, 1, 0.3, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1 });
          s.dot(x_, 0.19, { r: 7, color: 'gold' }); s.vline(x_, { color: 'gold', width: 1.5, dash: [3, 3] });
          if (!fixed) { tag(s, `$p_A = ${fx(pA, 3)}$`, a, 0.85, 'accent', { dy: -4 }); tag(s, `$p_B = ${fx(pB, 3)}$`, b, 0.85, 'orange', { dy: -4 }); }
          const payoff = (aa) => (fixed ? (aa + b) / 2 : (t * (b - aa) * (2 + aa + b) ** 2) / 18);
          const top = fixed ? 1 : 0.35;
          G.setView([0, 1], [0, top]);
          G.fn(payoff, { domain: [0, b - 0.02], color: 'accent', width: 2.6 });
          G.dot(a, payoff(a), { r: 7, color: 'accent' }); G.vline(b, { color: 'orange', width: 1.5, dash: [4, 3] });
          const best = argmax(payoff, 0, b - 0.02, 80);
          st = { fixed, a, b, pA, pB, x: x_, payoff: payoff(a), best, profB: fixed ? 1 - x_ : (pB - c) * (1 - x_) };
        });
        v.readout(() => st.fixed ? `A at $${fx(st.a, 3)}$, B at $${fx(st.b, 3)}$: A serves the customers up to $${fx(st.x, 3)}$ (a share $${fx(st.x, 3)}$), B the rest ($${fx(1 - st.x, 3)}$). A's profit-maximizing location given B is $${fx(st.best.x, 3)}$, right next to B: each seller gains by stepping towards the other, and the standoff is at the centre.` : `A at $${fx(st.a, 3)}$, B at $${fx(st.b, 3)}$: prices $${fx(st.pA, 3)}$ and $${fx(st.pB, 3)}$, A serves up to $${fx(st.x, 3)}$ and earns $${fx(st.payoff, 4)}$ (formula $t(b-a)(2+a+b)^2/18$); B earns $${fx(st.profB, 4)}$. A's best location given B is $${fx(st.best.x, 3)}$ (the left end): proximity is penalized by price competition.`);
      },
    },
  ],
};
