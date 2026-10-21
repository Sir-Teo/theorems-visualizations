// Microeconomics — Chapter 9: General equilibrium and welfare (items 9.1–9.6; 9.7–9.11 in ch09-b.js, 9.12–9.16 in ch09-c.js, 9.17–9.21 in ch09-d.js)
import { clamp, GUIDE, fx, bisect, plateText, bar, W1, W2, W, pref, levelPts, toBox, market, contractCurve, improvements, improveTrail, boxStage, drawBox, drawA, drawB, drawLens, priceLineBox, slopeSeg, nearestOnPath, pathLength, f2 } from './ch09.shared.js';
import { coreUtility, coreCurveY, coreAllocationState } from './source-audit-core-fringe.js';
import { walrasBudgetState, paddedRange } from './source-audit-exchange.js';
import { efficiencyUtility, efficientCurveY, efficientAllocationState, efficientComplementPolygons, efficiencyIndifference } from './source-audit-efficiency.js';

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
$$x_1^A + x_1^B = W_1,$$
$$x_2^A + x_2^B = W_2.$$
Because $B$'s bundle is determined by $A$'s, the whole set of feasible allocations is the rectangle $[0, W_1] \times [0, W_2]$, the **Edgeworth box**: a point $(x_1, x_2)$ is $A$'s bundle measured from the lower-left corner $O_A$ and, read from the upper-right corner $O_B$, $B$'s bundle $(W_1 - x_1,\, W_2 - x_2)$. The traders start from an **endowment** $\omega = (\omega^A, \omega^B)$, a point of the box. The **weakly preferred lens** is the set of feasible allocations each consumer weakly prefers to $\omega$: the intersection of their two upper contour sets, measured from opposite origins. A **Pareto improvement** additionally makes at least one consumer strictly better off. For the pictured positive Cobb–Douglas tastes and interior endowments, unequal marginal rates of substitution give trades strictly improving both consumers; at exact tangency the weak lens is a singleton. MRS comparisons require differentiability and nonzero marginal utilities, and the global tangency argument uses convex preferences. Other tastes can leave a line of equally preferred allocations at an efficient point (9.3).`,
      idea: String.raw`Feasibility is one equation per good, $x^A + x^B = \bar x$, so one point carries two bundles: the box is just the plane of $A$'s bundles with $B$'s axes drawn backwards from the opposite corner. In the pictured Cobb–Douglas family, convex upper contour sets and a common supporting tangent prevent a weak-all, strict-one improvement at tangency. Where the two slopes (the marginal rates of substitution of 4.11) differ, a small swap at a rate between them improves both traders. Smoothness justifies the local slope comparison; convex preferences justify its global converse. The weak lens includes indifferent allocations as well as any strict improvements, so a nonempty weak lens alone does not certify inefficiency. The explicit tests and nonsmooth examples of 9.2–9.3 develop those distinctions.`,
      caption: String.raw`**Drag the gold endowment point $\omega$** within the pictured interior range. Blue curve: $A$'s indifference curve through $\omega$, measured from $O_A$; orange curve: $B$'s, measured from $O_B$. Green raster shading illustrates allocations both weakly prefer. Both traders have Cobb–Douglas tastes; the sliders move each weight on good 1. At exact tangency the weak lens is a singleton. This introductory widget's lens-area readout is a grid estimate and its near-tangency label uses a finite numerical band; neither is an exact efficiency test. Use the explicit sets and gain checks in 9.2–9.3 for that distinction.`,
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
          return `$\\omega^A = (${f2(x)}, ${f2(y)})$ and $\\omega^B = (${f2(W1 - x)}, ${f2(W2 - y)})$: the two bundles always add up to the totals $(${W1}, ${W2})$.\nMarginal rates of substitution at $\\omega$: $MRS_A = ${f2(mA)}$, $MRS_B = ${f2(mB)}$. Utilities $u_A = ${f2(uA)}$, $u_B = ${f2(uB)}$. Sampled weak-lens area estimate: **${f2(lens * 100, 1)}%** of the box${Math.abs(Math.log(mA / mB)) < 0.02 ? ' (within the illustrated near-tangency band; exact efficiency is not inferred)' : ''}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.2
    {
      num: '9.2', kind: 'Definition', name: 'Pareto efficiency',
      statement: String.raw`A feasible allocation is **Pareto efficient** if no other feasible allocation makes at least one consumer strictly better off without making anyone worse off. A **Pareto improvement** satisfies those weak-all, strict-one inequalities. Efficiency is an ordinal condition and does not rank efficient allocations by fairness.

The picture uses two Cobb–Douglas utilities $u_A=x^a y^{1-a}$ and $u_B=(10-x)^b(10-y)^{1-b}$, with $0<a,b<1$. Their entire efficient set, including the two origins, is
$$y=f(x)=\frac{10b(1-a)x}{10a(1-b)+(b-a)x}.$$
The parameter range is $0\le x\le10$.
At an interior point, this is exactly $MRS_A=MRS_B$. Tangency alone is not sufficient for arbitrary smooth, monotone preferences: convexity is essential to the global argument.`,
      idea: String.raw`The MRS formula of 4.11 gives $MRS_A=ay/((1-a)x)$ and $MRS_B=b(10-y)/((1-b)(10-x))$; equating them gives $f$. Off that curve, a small swap at a rate strictly between the MRSs improves both traders. On it, a positive weighted sum of the two concave utilities has zero gradient and hence a global maximum, so a Pareto improvement is impossible. The origins are efficient because the trader with everything is already at maximum utility.

For a constructed improvement, restrict attention to $(t,f(t))$. Along this curve $A$'s utility increases and $B$'s decreases. Solve their two current-utility reservation equalities; the midpoint of the resulting interval gives an efficient allocation that improves both when the original point is off the curve. These are two scalar root solves, not repeated grid trades. Without convexity the conclusion fails: for each trader's own utility $x_1^2+x_2^2$, both MRSs equal one at the equal split, yet moving to $(10,0)$ for $A$ and $(0,10)$ for $B$ increases both utilities from $50$ to $100$.`,
      caption: String.raw`Drag the gold allocation or use its coordinate sliders, including the box boundary. Green shading is a sampled illustration of the weakly preferred lens; it does not decide efficiency. Turn on the purple **efficient curve** to see the explicit equation. A gold ring marks a constructed efficient improvement only when both utility gains are numerically resolved. **Choose efficient allocation** selects the reservation-interval construction and draws the move.`,
      scope: String.raw`Totals $(10,10)$; $0.15\le a,b\le0.85$; the full closed allocation box. A curve residual of at most $10^{-10}$ is reported as a numerical set match, not as an economic tolerance for efficiency. An off-set point remains off-set even when its candidate gains cannot be resolved above $10^{-12}$ in floating-point arithmetic. At boundary bundles the interior MRS formula is not used. The source supports the Pareto definition; the displayed formula and trade construction are derived here.`,
      deps: ['micro-9.1', 'micro-4.11'],
      refs: ['Debreu & Scarf (1963), Pareto definition p.235 and weak-all/strict-one convention pp.238–239', 'https://ucema.edu.ar/~fr05/curso_corto/Debreu-Scarf.pdf'], tags: ['welfare', 'efficiency'],
      credit: 'Pareto criterion as stated by Debreu & Scarf (1963), p.235; pictured Cobb–Douglas construction derived here',
      links: { source: 'https://ucema.edu.ar/~fr05/curso_corto/Debreu-Scarf.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Pareto_efficiency' },
      viz(v) {
        const aS=v.slider('$A$: weight on good 1',.15,.85,.65,{step:.01}),bS=v.slider('$B$: weight on good 1',.15,.85,.3,{step:.01});
        const tx=v.slider('allocation: good 1 for $A$',0,10,2.6,{step:.05,decimals:7}),ty=v.slider('allocation: good 2 for $A$',0,10,7.4,{step:.05,decimals:7});
        const cc=v.toggle('show the efficient curve',false),s=boxStage(v,{title:'an explicit efficient set and a constructive trade',height:430});
        v.legend([['accent','A’s indifference boundary'],['orange','B’s indifference boundary'],['green','sampled weak lens',{area:true}],['gold','allocation / resolved improvement'],['purple','efficient curve',{dash:true}]]);
        const H=s.handle(tx.value,ty.value,{color:'gold',r:9,constrain:{x:[0,10],y:[0,10]}});
        let move=null,info={};const current=()=>efficientAllocationState('cd',aS.value,bS.value,tx.value,ty.value);
        H.onDrag=()=>{tx.set(H.x);ty.set(H.y);move=null;};
        v.button('Choose efficient allocation',()=>{const p=current();move=p.witness?.resolved?[[p.x,p.y],p.target]:null;tx.set(p.target[0]);ty.set(p.target[1]);});
        v.render(()=>{
          H.set(tx.value,ty.value);const p=current(),green=v.rgb('green');drawBox(s,{axes:false});
          s.raster((x,y)=>x>=0&&x<=10&&y>=0&&y<=10&&efficiencyUtility('cd',p.a,x,y)>=p.uA&&efficiencyUtility('cd',p.b,10-x,10-y)>=p.uB?[green[0],green[1],green[2],55]:null,{key:`eff2|${p.a}|${p.b}|${p.x}|${p.y}|${green}`,res:3});
          if(cc.value)s.path(Array.from({length:261},(_,i)=>[i/26,efficientCurveY('cd',p.a,p.b,i/26)]),{color:'purple',width:2.4,dash:[6,4]});
          s.path(efficiencyIndifference('cd',p.a,p.uA),{color:'accent',width:2});s.path(efficiencyIndifference('cd',p.b,p.uB).map(([x,y])=>[10-x,10-y]),{color:'orange',width:2});
          const witness=p.witness?.resolved?p.witness.point:null;
          if(witness){const gap=Math.hypot(s.X(p.x)-s.X(witness[0]),s.Y(p.y)-s.Y(witness[1]));s.arrow(p.x,p.y,...witness,{color:'gold',width:1.8});s.dot(...witness,{color:'gold',r:gap<22?14:6,hollow:true});}
          if(move&&Math.hypot(p.x-move[1][0],p.y-move[1][1])<1e-10){s.arrow(...move[0],...move[1],{color:'gold',width:1.8,dash:[4,3]});s.dot(...move[0],{color:'gold',r:4,hollow:true});}
          info=p;
        });
        v.readout(()=>{const p=info,interior=p.x>0&&p.x<10&&p.y>0&&p.y<10;
          const rates=interior?`Interior MRSs: $A=${f2(p.a*p.y/((1-p.a)*p.x),7)}$, $B=${f2(p.b*(10-p.y)/((1-p.b)*(10-p.x)),7)}$.`:'Boundary allocation: the interior MRS comparison is not used.';
          return `Allocation $A=(${f2(p.x,7)},${f2(p.y,7)})$, $B=(${f2(10-p.x,7)},${f2(10-p.y,7)})$. Utilities $A=${f2(p.uA,7)}$, $B=${f2(p.uB,7)}$.\n**${p.relation==='off'?'Off the explicit efficient set.':'Matches the explicit efficient set within numerical tolerance.'}** Curve residual $y-f(x)=${v.sci(p.residual,4)}$. ${rates}${p.witness? p.witness.resolved?`\nConstructed efficient improvement $(${p.target.map(q=>f2(q,7)).join(',')})$: utility gains ${p.witness.gains.map(q=>'$'+v.sci(q,4)+'$').join(', ')}.`:'\nThe point is off-set, but the candidate utility gains are below arithmetic resolution.':''} Shading is illustrative and never certifies membership.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.3
    {
      num: '9.3', kind: 'Definition', name: 'Contract curve',
      statement: String.raw`Here **contract curve** means the complete **Pareto set** of feasible allocations, with no endowment reservation constraint. This modern convention differs from Debreu–Scarf's 1963 introduction, which reserves the term for efficient, individually rational allocations; that smaller set is the two-person core of 9.4.

For the pictured smooth families, $u=(a x^\rho+(1-a)y^\rho)^{1/\rho}$ with $\rho=-1.5$, or Cobb–Douglas when $\rho=0$, the entire efficient curve is
$$y=f_\rho(x)=\frac{10\eta x}{10+(\eta-1)x},\quad0\le x\le10,$$
$$\eta=\left[\frac{b(1-a)}{a(1-b)}\right]^{1/(1-\rho)}.$$
For complements $u=\min\{(1-a)x,ay\}$, let $f_A=(1-a)x-ay$ and $f_B=(1-b)(10-x)-b(10-y)$. The efficient set is $\{f_A\ge0,f_B\ge0\}\cup\{f_A\le0,f_B\le0\}$. For substitutes $u=ax+(1-a)y$, it is the bottom/right edges when $a>b$, the left/top edges when $a<b$, and the whole box when $a=b$.`,
      idea: String.raw`For the smooth families, 4.11 gives $MRS=a(y/x)^{1-\rho}/(1-a)$. Equality produces the displayed curve. These utilities are concave; a positive weighted sum has a stationary global maximum at each interior curve point. Off it, an exchange at a rate between the MRSs improves both. This global convex-preference argument is essential; tangency alone does not establish efficiency.

For complements, the allocations both weakly prefer are exactly the rectangle
$$x\in\left[\frac{u_A}{1-a},10-\frac{u_B}{1-b}\right],$$
$$y\in\left[\frac{u_A}{a},10-\frac{u_B}{b}\right].$$
If either side has zero length, a resource requirement binds, so neither utility can rise without lowering the other. A nontrivial weakly preferred line segment can therefore remain at an efficient allocation: a weak lens need not be a singleton. If both sides have positive length, both utilities can rise. For substitutes with unequal slopes, exchange at an intermediate rate until one of the indicated edges binds; with equal slopes the two utilities sum to a constant, making every allocation efficient.`,
      caption: String.raw`Select a taste family, then drag the gold allocation or use the full-box coordinate sliders. Purple is the efficient set from the explicit formulas, including its boundary; complementary kink rays are dashed. Green raster shading illustrates weak preference. For complements, the green rectangle boundary also remains visible when it collapses to a line. A gold ring is shown only for a resolved strict improvement. **Choose efficient allocation** uses a reservation-interval, resource-binding, or intermediate-rate construction. It does not claim the nearest point.`,
      scope: String.raw`Two goods with totals $(10,10)$ and taste parameters $0.15\le a,b\le0.85$. CES uses the common value $\rho=-1.5$; complements use the coefficients $(1-a,a)$ displayed above. Smooth membership uses the coordinate residual; substitutes use distance to the indicated edges; complements use the smaller weak-rectangle side length. Residuals within $10^{-10}$ are numerical set matches. Candidate gains must both exceed $10^{-12}$ to be shown as resolved. These are arithmetic tolerances, not economic bands. Raster pixels never determine the verdict; degeneracies and box endpoints are included.`,
      deps: ['micro-9.2', 'micro-4.11'],
      refs: ['Debreu & Scarf (1963), Pareto definition and terminology p.235; weak-all/strict-one convention pp.238–239', 'https://ucema.edu.ar/~fr05/curso_corto/Debreu-Scarf.pdf'], tags: ['welfare', 'exchange'],
      credit: 'Pareto-set definition grounded in Debreu & Scarf (1963); explicit four-family geometry derived here',
      links: { source: 'https://ucema.edu.ar/~fr05/curso_corto/Debreu-Scarf.pdf', wikipedia: 'https://en.wikipedia.org/wiki/Contract_curve' },
      viz(v) {
        const fam=v.select('both traders have',[{value:'cd',label:'Cobb–Douglas'},{value:'ces',label:'CES (ρ = −1.5)'},{value:'comp',label:'perfect complements'},{value:'subs',label:'perfect substitutes'}],'cd');
        const aS=v.slider('$A$: taste parameter $a$',.15,.85,.6,{step:.01}),bS=v.slider('$B$: taste parameter $b$',.15,.85,.3,{step:.01});
        const tx=v.slider('allocation: good 1 for $A$',0,10,2.5,{step:.05,decimals:7}),ty=v.slider('allocation: good 2 for $A$',0,10,7,{step:.05,decimals:7});
        const s=boxStage(v,{title:'the complete efficient set, including its boundary',height:430});
        v.legend([['purple','efficient curve / region'],['accent','A’s indifference boundary'],['orange','B’s indifference boundary'],['green','weak lens (illustration)',{area:true}],['gold','allocation / resolved improvement']]);
        const H=s.handle(tx.value,ty.value,{color:'gold',r:9,constrain:{x:[0,10],y:[0,10]}});H.onDrag=()=>{tx.set(H.x);ty.set(H.y);};
        const current=()=>efficientAllocationState(fam.value,aS.value,bS.value,tx.value,ty.value);let info={};
        v.button('Choose efficient allocation',()=>{const p=current();tx.set(p.target[0]);ty.set(p.target[1]);});
        v.render(()=>{
          H.set(tx.value,ty.value);const p=current(),green=v.rgb('green');drawBox(s,{axes:false});
          if(p.family==='cd'||p.family==='ces')s.path(Array.from({length:261},(_,i)=>[i/26,efficientCurveY(p.family,p.a,p.b,i/26)]),{color:'purple',width:4});
          else if(p.family==='comp'){
            for(const poly of efficientComplementPolygons(p.a,p.b))s.poly(poly,{color:'purple',width:4,fill:'purple',fillAlpha:.18});
            const ta=Math.min(10/p.a,10/(1-p.a)),tb=Math.min(10/p.b,10/(1-p.b));
            s.line(0,0,p.a*ta,(1-p.a)*ta,{color:'accent',width:1.4,dash:[4,4]});s.line(10,10,10-p.b*tb,10-(1-p.b)*tb,{color:'orange',width:1.4,dash:[4,4]});
          }else if(p.a===p.b)s.rect(0,0,10,10,{fill:'purple',fillAlpha:.18,stroke:false});
          else s.path(p.a>p.b?[[0,0],[10,0],[10,10]]:[[0,0],[0,10],[10,10]],{color:'purple',width:4});
          s.raster((x,y)=>x>=0&&x<=10&&y>=0&&y<=10&&efficiencyUtility(p.family,p.a,x,y)>=p.uA&&efficiencyUtility(p.family,p.b,10-x,10-y)>=p.uB?[green[0],green[1],green[2],55]:null,{key:`eff3|${p.family}|${p.a}|${p.b}|${p.x}|${p.y}|${green}`,res:3});
          s.path(efficiencyIndifference(p.family,p.a,p.uA),{color:'accent',width:2});s.path(efficiencyIndifference(p.family,p.b,p.uB).map(([x,y])=>[10-x,10-y]),{color:'orange',width:2});
          if(p.family==='comp'){const r=p.reservation;s.rect(r.left,r.bottom,r.right,r.top,{color:'green',width:3,dash:[5,3]});}
          if(p.witness?.resolved){const gap=Math.hypot(s.X(p.x)-s.X(p.target[0]),s.Y(p.y)-s.Y(p.target[1]));s.arrow(p.x,p.y,...p.target,{color:'gold',width:1.8});s.dot(...p.target,{color:'gold',r:gap<22?14:6,hollow:true});}info=p;
        });
        v.readout(()=>{const p=info,how=p.family==='subs'?p.a===p.b?'Equal substitute slopes: every feasible allocation is efficient.':p.a>p.b?'Substitutes: the efficient set is the bottom and right edges.':'Substitutes: the efficient set is the left and top edges.':p.family==='comp'?`Complements: weak-rectangle side lengths ${f2(p.reservation.slack1,9)} and ${f2(p.reservation.slack2,9)}; a zero side prevents any strict gain.`:'Smooth tastes: the displayed equation includes both efficient origins.';
          return `${how}\nAllocation $A=(${f2(p.x,7)},${f2(p.y,7)})$, $B=(${f2(10-p.x,7)},${f2(10-p.y,7)})$. Utilities $A=${f2(p.uA,7)}$, $B=${f2(p.uB,7)}$. **${p.relation==='all'?'Every allocation is efficient.':p.relation==='off'?'Off the explicit efficient set.':'Matches the explicit efficient set within numerical tolerance.'}** Set residual $${v.sci(p.residual,4)}$.${p.witness?p.witness.resolved?`\nConstructed efficient improvement $(${p.target.map(q=>f2(q,7)).join(',')})$: utility gains ${p.witness.gains.map(q=>'$'+v.sci(q,4)+'$').join(', ')}.`:'\nThe point is off-set, but the candidate utility gains are below arithmetic resolution.':''} The weak lens can contain equally preferred points at an efficient allocation; its raster area is not a membership test.`;
        });
      },
    },
    // ------------------------------------------------------------------ 9.4
    {
      num: '9.4', kind: 'Definition', name: 'Core of an exchange economy',
      statement: String.raw`A coalition $S$ **blocks** a feasible allocation if it can redistribute its own initial endowments so that every member is weakly better off and at least one is strictly better off. The **core** consists of feasible allocations blocked by no coalition. This is the weak-all, strict-one convention used by Debreu and Scarf (1963).

With two traders the only coalitions are $\{A\}$, $\{B\}$ and $\{A,B\}$. Thus the core is exactly the Pareto-efficient allocations satisfying both reservation constraints:
$$u_A(x^A)\ge u_A(\omega^A),\qquad u_B(x^B)\ge u_B(\omega^B).$$
For the pictured Cobb–Douglas utilities $u_A=x^a y^{1-a}$ and $u_B=(10-x)^b(10-y)^{1-b}$, $0<a,b<1$, the efficient curve is
$$y(x)=\frac{10b(1-a)x}{10a(1-b)+(b-a)x},\quad0\le x\le10.$$
Its core segment has endpoints where $A$'s and $B$'s respective reservation constraints bind; it can collapse to a single allocation.`,
      idea: String.raw`A singleton can withdraw its own endowment, so neither trader can receive a worse bundle in the core. The pair can redistribute all resources, so a core allocation must also be Pareto efficient. These are all the coalitions in a two-person economy, making the conditions sufficient as well as necessary.

For the positive Cobb–Douglas bundles, equating the two marginal rates of substitution gives the rational curve above. Along it $A$'s utility rises strictly with $x$ and $B$'s falls strictly. Solving the two reservation equalities therefore gives a closed interval, including both endpoints. For an inefficient test allocation, the same construction using its current utilities finds a feasible allocation that improves both traders; the red witness and utility gains demonstrate the block directly.`,
      caption: String.raw`Move the gold **endowment** and black **test allocation**, or use their separate sliders when they coincide. Purple is the complete efficient curve; the thick green interval and its endpoint rings are the core. Thin blue/orange curves bound the endowment's individually rational lens. **Lower/upper core endpoint** selects an exact reservation boundary; **project into core** selects the curve at the test point's horizontal coordinate, clipped to the core interval. **Efficient endowment** makes the core collapse to one point. A red witness, when shown, is an actual feasible improvement for the pair.`,
      scope: String.raw`Two goods with totals $(10,10)$; positive taste weights $0.15\le a,b\le0.85$; positive endowments $0.3\le\omega_1^A,\omega_2^A\le9.7$ and the complementary bundle for $B$. Test allocations range over the entire feasible box. Utilities are model values, not interpersonal welfare measurements. Only numerical precision ($10^{-10}$ in utility or coordinate residuals) is used for computed membership; a percentage difference in marginal rates is not treated as economic efficiency.`,
      deps: ['micro-9.3'],
      refs: ['Debreu & Scarf (1963), introduction and core definition, pp.235–239; competitive allocation argument p.240', 'https://ucema.edu.ar/~fr05/curso_corto/Debreu-Scarf.pdf'], tags: ['exchange'],
      credit: 'Debreu & Scarf, 1963, §2 (reviewed blocking definition)',
      verify: false,
      links: { source: 'https://ucema.edu.ar/~fr05/curso_corto/Debreu-Scarf.pdf' },
      viz(v) {
        const aS=v.slider('$A$: weight on good 1',.15,.85,.65,{step:.01}),bS=v.slider('$B$: weight on good 1',.15,.85,.3,{step:.01});
        const wx=v.slider('endowment: good 1 for $A$',.3,9.7,3,{step:.05,decimals:4}),wy=v.slider('endowment: good 2 for $A$',.3,9.7,7,{step:.05,decimals:4});
        const tx=v.slider('test: good 1 for $A$',0,10,6,{step:.05,decimals:4}),ty=v.slider('test: good 2 for $A$',0,10,6,{step:.05,decimals:4});
        const s=v.stage({x:[-1.5,11.5],y:[-1.5,11.5],axes:'box',gutter:true,height:430,xlabel:'good 1 allocated to A',ylabel:'good 2 allocated to A',title:'the core and a genuine blocking witness'});
        v.legend([['purple','efficient curve'],['green','core interval / endpoints'],['green','individually rational lens',{area:true}],['accent','A’s reservation boundary'],['orange','B’s reservation boundary'],['gold','endowment'],['ink','test allocation'],['red','pair improvement witness']]);
        const H=s.handle(3,7,{color:'gold',r:9,constrain:{x:[.3,9.7],y:[.3,9.7]}}),T=s.handle(6,6,{color:'ink',r:8,constrain:{x:[0,10],y:[0,10]}});
        H.onDrag=()=>{wx.set(H.x);wy.set(H.y);};T.onDrag=()=>{tx.set(T.x);ty.set(T.y);};
        const current=()=>coreAllocationState(aS.value,bS.value,wx.value,wy.value,tx.value,ty.value),setTest=p=>{tx.set(p[0]);ty.set(p[1]);};
        v.button('lower core endpoint',()=>setTest(current().lowPoint));v.button('upper core endpoint',()=>setTest(current().highPoint));
        v.button('project into core',()=>{const p=current(),x=clamp(tx.value,p.lower,p.upper);setTest([x,coreCurveY(aS.value,bS.value,x)]);});
        v.button('efficient endowment',()=>{wx.set(5);wy.set(coreCurveY(aS.value,bS.value,5));});
        let info={};
        v.render(()=>{
          H.set(wx.value,wy.value);T.set(tx.value,ty.value);const p=current(),y=x=>coreCurveY(p.a,p.b,x),green=v.rgb('green');
          s.rect(0,0,10,10,{color:'muted',width:1.5});
          s.raster((x,z)=>x>=0&&x<=10&&z>=0&&z<=10&&coreUtility(p.a,x,z)>=p.reservationA&&coreUtility(p.b,10-x,10-z)>=p.reservationB?[green[0],green[1],green[2],45]:null,{key:`core-lens|${p.a}|${p.b}|${p.wx}|${p.wy}|${green}`,res:3});
          s.fn(y,{domain:[0,10],color:'purple',width:2.2,n:260});
          const xa=(p.reservationA/10**(1-p.a))**(1/p.a),xb=(p.reservationB/10**(1-p.b))**(1/p.b);
          s.curve(t=>{const x=xa*(10/xa)**t;return[x,(p.reservationA/x**p.a)**(1/(1-p.a))];},0,1,{color:'accent',width:1.8,n:240});
          s.curve(t=>{const x=xb*(10/xb)**t;return[10-x,10-(p.reservationB/x**p.b)**(1/(1-p.b))];},0,1,{color:'orange',width:1.8,n:240});
          s.fn(y,{domain:[p.lower,p.upper],color:'green',width:6,n:150});
          const endpointRadius=p.lower===p.upper?14:6;
          s.dot(...p.lowPoint,{color:'green',r:endpointRadius,hollow:true});if(p.lower!==p.upper)s.dot(...p.highPoint,{color:'green',r:6,hollow:true});
          if(p.witness?.resolved){const d=Math.hypot(s.X(p.witness.point[0])-s.X(p.x),s.Y(p.witness.point[1])-s.Y(p.y));s.arrow(p.x,p.y,...p.witness.point,{color:'red',width:1.7});s.dot(...p.witness.point,{color:'red',r:d<18?12:5,hollow:true});}
          info=p;
        });
        v.readout(()=>{const p=info;return `Core interval in good 1: $[${f2(p.lower,7)},${f2(p.upper,7)}]${p.lower===p.upper?'$ (one allocation).':'$.'} Test: **${p.verdict}**.\nReservation utilities: $A=${f2(p.reservationA,7)}$, $B=${f2(p.reservationB,7)}$; test utilities $A=${f2(p.uA,7)}$, $B=${f2(p.uB,7)}$. IR slacks: ${f2(p.slackA,9)}, ${f2(p.slackB,9)}. Curve residual $y-y(x)=${f2(p.residual,9)}$.${p.witness?.resolved?`\nPair witness $(${p.witness.point.map(q=>f2(q,7)).join(',')})$: utility gains ${p.witness.gains.map(q=>'$'+v.sci(q,4)+'$').join(', ')}. The two complementary bundles still sum to $(10,10)$.`:p.witness?'\nThe curve test detects inefficiency, but the candidate utility gains are below arithmetic resolution.':''}`;});
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
