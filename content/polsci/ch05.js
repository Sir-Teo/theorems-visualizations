// Political Science & Social Choice — Chapter 5: Turnout, information and juries (items 5.1-5.5; the rest are in ch05-b.js)
import {downsVoting} from './source-audit-downs-items.js';
import { assertJurySliderTick, assertOddJurySize, juryProbability, juryMass, juryLowerBound, juryLeader, juryNumber } from './source-audit-jury.js';
import { sum, range, clamp, mean, pct, Phi, phi, lgam, binomPmf, binomTail, majProb, tieProb, hoeffding, logspace } from './ch05.shared.js';

export default {
  collection: 'polsci',
  chapter: 5,
  title: 'Turnout, information and juries',
  summary: String.raw`A single vote almost never decides a large election, so a purely instrumental voter, who votes only to change the result, should stay home: this is the paradox of voting. The calculus of voting repairs the prediction by adding a taste for voting itself, and the probability of a decisive vote turns out to be an exact binomial calculation, with a very different size depending on what the voter knows about the electorate. Voting also aggregates information. For independent voters with the same fixed better-than-chance competence, Condorcet’s jury theorem sends majority accuracy toward one as odd jury size grows; a shared-leader model shows how dependence can obstruct this conclusion, and strategic jurors who vote as though they were pivotal can make a unanimous jury convict more innocent defendants as it grows. The last items look at who bothers to learn anything (rational ignorance), why noisy electorates can still be wise (the miracle of aggregation), and why an uninformed voter may do best to abstain (the swing voter's curse). The chapter ends with Condorcet's own essay of 1785.`,
  items: [
    // Source-audited finite comparison 5.1
    downsVoting,

    // ───────────────────────────────────────────────────────────── 5.2
    {
      num: '5.2',
      kind: 'Model',
      name: 'The calculus of voting (Riker–Ordeshook)',
      statement: String.raw`In the **calculus of voting**, a citizen votes when her reward
$$R = pB - C + D$$
is positive (or at least non-negative), where $B$ is the difference in benefit between her preferred and her less preferred outcome, $p$ the probability that her vote is decisive, $C$ the cost of voting and $D$ a term for the *direct* satisfaction of voting (a sense of duty, expressing a preference, taking part). The $pB$ term depends on the size and closeness of the election; $C$ and $D$ do not. Consequently turnout in a large electorate is predicted by the share of citizens whose $D$ exceeds their $C$, and a close election raises turnout only through the small term $pB$.`,
      idea: String.raw`Without $D$, the rule $pB>C$ reproduces the paradox of voting (polsci-5.1): $p$ is negligible, so $R<0$ for nearly everyone. Adding a $D$ that does not shrink with $n$ restores positive turnout: a voter votes if her duty outweighs her cost, up to a small correction. The model is a classification of motives, and its price is flexibility: $D$ can absorb any pattern of turnout, which is why the model is often judged by what it implies for how turnout *varies* (with cost, with closeness) rather than for its level.`,
      caption: String.raw`Left: each dot is one of 300 simulated citizens with a cost $C$ (horizontal) and a total reward $D+pB$ (vertical). Citizens above the diagonal vote ($R>0$), the others stay home. Right: the share who vote as the electorate grows. Without $D$ (red) turnout collapses; with it (green) turnout settles at the share of citizens with $D>C$. Change the stake, the typical cost and duty, the lean of the electorate (a closer race raises $p$) and the toggle.`,
      deps: ['polsci-5.1'],
      see: ['polsci-5.3', 'polsci-5.7'],
      refs: ['Shepsle: voting and turnout', 'Riker and Ordeshook (1968), American Political Science Review 62: 25–42'],
      tags: ['turnout', 'civic duty'],
      credit: 'William H. Riker and Peter C. Ordeshook, 1968',
      scope: String.raw`The population is a model, not data: costs $C$ and duty terms $D$ are drawn from log-normal distributions (spread $0.6$ and $0.5$ in the logarithm) around the medians you set, with the same stake $B$ for everyone, and $p$ is the tie probability of $n$ independent voters with the lean you set (polsci-5.3).`,
      links: { doi: 'https://doi.org/10.2307/1953324' },
      viz(v) {
        const rng = v.rng(7), M = 300, zc = range(M).map(() => rng.normal()), zd = range(M).map(() => rng.normal());
        const S = v.stage({ x: [0.5, 500], y: [0.5, 500], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'cost of voting $C$', ylabel: 'reward $D+pB$', title: 'who votes' });
        const T = v.stage({ x: [1e3, 1e9], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 340, minWidth: 300, xlabel: 'number of voters $n$', ylabel: 'turnout', title: 'turnout against electorate size' });
        const B = v.slider('stake $B$', 100, 1e6, 5000, { log: true, sig: 2 });
        const cm = v.slider('median cost $C$', 1, 100, 8, { log: true, sig: 2 });
        const dm = v.slider('median duty $D$', 1, 100, 6, { log: true, sig: 2 });
        const lean = v.slider('expected lean (points)', 0, 2, 0, { step: 0.05 });
        const nS = v.slider('electorate size $n$', 1e3, 1e9, 1e6, { log: true, sig: 2 });
        const useD = v.toggle('include duty $D$', true);
        const Cs = zc.map((z) => cm.value * Math.exp(0.6 * z));
        const turnout = (n, withD, b, q, cmv, dmv) => {
          const pB = b * tieProb(Math.round(n / 2) * 2, q);
          let k = 0;
          for (let i = 0; i < M; i++) if ((withD ? dmv * Math.exp(0.5 * zd[i]) : 0) + pB > cmv * Math.exp(0.6 * zc[i])) k++;
          return k / M;
        };
        let last = {};
        v.render(() => {
          const b = B.value, q = 0.5 + lean.value / 100, n = Math.round(nS.value / 2) * 2, pB = b * tieProb(n, q);
          {
            S.line(0.5, 0.5, 500, 500, { color: 'faint', width: 1.4 });
            const yes = [], no = [];
            for (let i = 0; i < M; i++) {
              const C = cm.value * Math.exp(0.6 * zc[i]), D = (useD.value ? dm.value * Math.exp(0.5 * zd[i]) : 0), y = D + pB;
              (y > C ? yes : no).push([C, Math.max(y, 0.5001)]);
            }
            S.dots(no, { r: 3, color: 'gold' });
            S.dots(yes, { r: 3, color: 'green' });
            S.text('votes', 6, 150, { color: 'green', size: 12, weight: 700 });
            S.text('stays home', 100, 1.2, { color: 'gold', size: 12, weight: 700 });
            last.share = yes.length / M;
          }
          const ns = logspace(1e3, 1e9, 70);
          T.path(ns.map((x) => [x, turnout(x, false, b, q, cm.value, dm.value)]), { color: 'red', width: 2.2 });
          T.path(ns.map((x) => [x, turnout(x, true, b, q, cm.value, dm.value)]), { color: 'green', width: 2.2 });
          T.vline(n, { color: 'gold', width: 1.6, dash: true });
          last.t0 = turnout(n, false, b, q, cm.value, dm.value); last.t1 = turnout(n, true, b, q, cm.value, dm.value); last.pB = pB;
        });
        v.legend([['red', 'turnout without $D$'], ['green', 'turnout with $D$'], ['gold', 'current $n$', { dash: true }]]);
        v.readout(() => `At $n=${v.sci(Math.round(nS.value), 2)}$: $pB=${v.sci(last.pB, 3)}$. Turnout without duty ${pct(last.t0, 0)}, with duty ${pct(last.t1, 0)}; the left panel shows ${pct(last.share, 0)} voting. The reward is dominated by $D$ unless $pB$ is comparable to the typical cost.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.3
    {
      num: '5.3',
      kind: 'Theorem',
      name: 'The probability of a decisive vote',
      statement: String.raw`Let $n$ be even and let each of $n$ other voters vote for $A$ independently with probability $q$ and for $B$ otherwise. Your vote is decisive exactly when the others tie, which has probability
$$P_n(q)=\binom{n}{n/2}\,\bigl(q(1-q)\bigr)^{n/2}.$$
(a) If $q=\tfrac12$ then $P_n \sim \sqrt{\dfrac{2}{\pi n}}$ as $n\to\infty$.
(b) If $q\neq\tfrac12$ then $P_n \le \dfrac{(4q(1-q))^{n/2}}{\sqrt{\pi n/2}}$, which decays exponentially in $n$.
(c) If $q$ is itself uncertain with a density $f$ that is continuous at $\tfrac12$, then the probability of a tie, averaged over $q$, is asymptotically $f(\tfrac12)/n$; for the uniform density it equals exactly $1/(n+1)$.`,
      idea: String.raw`Stirling's formula (pma-8.22) turns $\binom{n}{n/2}\approx 2^n\sqrt{2/(\pi n)}$ into (a), and the bound in (b) is the same estimate multiplied by $(4q(1-q))^{n/2}<1$. For even $n=2k$, the beta integral (pma-8.20) evaluates the uniform-prior average exactly: $\binom{2k}{k}B(k+1,k+1)=1/(2k+1)$. Its parameters $k+1$ are positive, including $n=0$. Part (c) is an integral of the binomial probability: the tie probability as a function of $q$ is a spike of height $\sqrt{2/\pi n}$ and width of order $1/\sqrt n$ around $\tfrac12$, whose area is exactly $1/(n+1)$, so a prior that is spread out over the width of the spike gives $f(\tfrac12)/n$. The size of $p$ in the calculus of voting therefore depends on what the voter knows: certainty about a lean makes it vanish, honest uncertainty makes it merely small.`,
      caption: String.raw`Left: the exact distribution of the number of votes for $A$ among $n$ voters; the green bar is the tie. Right (both axes logarithmic): the tie probability against $n$. Blue is the exact value for the lean you set, the dashed line is $\sqrt{2/\pi n}$ for a dead heat, orange is the tie probability when the lean itself is uncertain with the standard deviation $\sigma$ you choose (a normal approximation, which falls like $1/n$ instead of exponentially).`,
      deps: ['polsci-5.1', 'pma-8.22', 'pma-8.20'],
      see: ['polsci-5.2', 'polsci-7.6'],
      refs: ['Shepsle: voting and turnout', 'Good and Mayer (1975), Behavioral Science 20: 25–33', 'Gelman, Silver and Edlin (2012), Economic Inquiry 50: 321–326'],
      tags: ['pivotal voter', 'binomial'],
      scope: String.raw`Independent voters with a common $q$ (part c: a common $q$ drawn once from the prior). For (c) the orange curve uses the local normal approximation of the tie probability, $\frac1n\,N\!\bigl(q_0-\tfrac12;\,0,\ \sigma^2+\tfrac1{4n}\bigr)$, valid when $n$ is large and $q$ is not far from $\tfrac12$.`,
      links: {},
      viz(v) {
        const L = v.stage({ x: [-1, 21], y: [0, 0.3], axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'votes for $A$', ylabel: 'probability', title: 'the tally of $n$ voters' });
        const R = v.stage({ x: [2, 1e6], y: [1e-12, 1], xlog: true, ylog: true, axes: 'box', gutter: true, height: 320, minWidth: 300, xlabel: 'number of voters $n$', ylabel: 'probability of a tie', title: 'the probability of a decisive vote' });
        const nS = v.slider('voters $n$', 2, 100, 20, { int: true, step: 2 });
        const lean = v.slider('lean $q_0-\\tfrac12$ (points)', 0, 5, 1, { step: 0.1 });
        const sig = v.slider('uncertainty $\\sigma$ (points)', 0.1, 5, 2, { log: true, sig: 2 });
        let info = {};
        v.render(() => {
          const n = Math.round(nS.value / 2) * 2, q = 0.5 + lean.value / 100, sd = sig.value / 100;
          const vals = range(n + 1).map((k) => binomPmf(n, k, q)), mx = Math.max(...vals);
          L.setView([-1, n + 1], [0, mx * 1.2]);
          L.bars(vals, { x0: 0, dx: 1, color: (val, i) => (i === n / 2 ? 'green' : 'accent') });
          L.vline(n / 2, { color: 'green', alpha: 0.4, dash: true });
          const mix = (m) => (1 / m) * phi((lean.value / 100) / Math.sqrt(sd * sd + 1 / (4 * m))) / Math.sqrt(sd * sd + 1 / (4 * m));
          R.fn((x) => tieProb(Math.round(x / 2) * 2 || 2, q), { color: 'accent', width: 2.4, n: 200 });
          R.fn((x) => Math.sqrt(2 / (Math.PI * x)), { color: 'ink', width: 1.4, dash: true, n: 100 });
          R.fn(mix, { color: 'orange', width: 2.2, n: 200 });
          R.vline(n, { color: 'gold', width: 1.6, dash: true });
          info = { n, q, tie: binomPmf(n, n / 2, q), asym: Math.sqrt(2 / (Math.PI * n)), mix: mix(n), mixBig: mix(1e6) };
        });
        v.legend([['accent', 'exact, lean known'], ['ink', '$\\sqrt{2/\\pi n}$ (dead heat)', { dash: true }], ['orange', 'lean uncertain'], ['green', 'tie', { dot: true }]]);
        v.readout(() => `For $n=${info.n}$: tie probability **$${v.sci(info.tie, 3)}$** (exact), dead-heat formula $\\sqrt{2/\\pi n}=${v.sci(info.asym, 3)}$, uncertain lean $${v.sci(info.mix, 3)}$. At $n=10^6$ with this uncertainty the tie probability is about $${v.sci(info.mixBig, 3)}$, while with the lean known exactly it is $${v.sci(tieProb(1e6, info.q), 3)}$.`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.4
    {
      num: '5.4',
      kind: 'Theorem',
      name: 'Condorcet’s jury theorem',
      statement: String.raw`Fix two alternatives with exactly one correct. For odd $n=2m+1$, let the correct-vote indicators be independent, each with the same fixed probability $p\in[0,1]$. Sincere simple majority is correct with probability
$$\begin{aligned}P_n(p)&=\sum_{k=m+1}^{n}b_k,\\b_k&=\binom nk p^k(1-p)^{n-k}.\end{aligned}$$
For $1/2<p<1$ this probability strictly increases along odd jury sizes and tends to $1$; for $0<p<1/2$ it strictly decreases and tends to $0$. At $p=1/2$ it is exactly $1/2$. At $p=0$ or $1$ it is exactly $p$ for every $n$. For $p>1/2$ a variance bound gives
$$\begin{aligned}P_n(p)&\ge\max\{0,1-B_n(p)\},\\B_n(p)&=\frac{p(1-p)}{n(p-1/2)^2}.\end{aligned}$$`,
      idea: String.raw`The product rule for independent votes (prob-2.1.1a) gives the binomial sum. Their average has mean $p$ and variance $p(1-p)/n$. Applying the actual variance estimate in the weak law (prob-2.2.3) to the error event gives the displayed bound and its limit. A finite jury still has positive error when $0<p<1$.

For monotonicity, adding two voters changes the outcome only when the first $n=2m+1$ correct-vote count is $m$ or $m+1$. Subtracting these two cases gives
$$\begin{aligned}&P_{n+2}(p)-P_n(p)\\&\quad=\binom n m[p(1-p)]^{m+1}\\&\qquad\cdot(2p-1).\end{aligned}$$
Symmetry gives $P_n(1-p)=1-P_n(p)$, including the fair-coin case. The bound explains the limit; the finite formula determines the curves.`,
      caption: String.raw`Choose the fixed competence and an odd jury size. Left: finite majority accuracy for $p$ and $1-p$; the dashed variance lower bound appears only for $p>1/2$ and can be very loose. Right: all $n+1$ binomial outcomes, with a strict majority in green. The selected dots show the finite jury, and the readout retains its error probability even when accuracy rounds to one.`,
      deps: ['prob-2.1.1a', 'prob-2.2.3'],
      see: ['polsci-5.3', 'polsci-5.5', 'polsci-5.8', 'polsci-5.10'],
      refs: ['Easley and Kleinberg (2010), Networks, Crowds, and Markets, §23.7, pp.756–758 (author preprint); finite monotonicity and variance calculation derived here'],
      tags: ['jury theorem', 'majority rule'],
      scope: String.raw`This is the fixed-truth, equal-competence, independent-vote theorem, conditional on which alternative is correct. Odd sizes exclude ties; no even-size tie rule is asserted. The source is the authors’ modern exposition, not a reading of Condorcet’s original essay. Different competences, strategic voting and general dependence require their own hypotheses. Binary64 arithmetic evaluates the exact finite formula; values rounded to one are labelled, and small errors are evaluated independently rather than by subtracting from one. Individual bar heights below binary64’s positive range round to zero; all count classes are retained.`,
      verify: false,
      links: { source: 'https://www.cs.cornell.edu/home/kleinber/networks-book/networks-book-ch23.pdf' },
      viz(v) {
        const A=v.stage({x:[-12,314],y:[-.07,1.08],axes:'box',gutter:true,height:330,minWidth:300,xlabel:'odd jury size $n$',ylabel:'probability majority is right',title:'finite majority accuracy'});
        const B=v.stage({x:[-2,33],y:[-.08,1.12],axes:'box',gutter:true,height:330,minWidth:300,xlabel:'number of correct votes',ylabel:'probability',title:'all binomial outcomes'});
        const pS=v.slider('competence $p$',0,1,.55,{step:.005,decimals:3,onChange:x=>assertJurySliderTick(x,200)});
        const nS=v.slider('odd jury size $n$',1,301,31,{int:true,step:2,onChange:assertOddJurySize});
        let cache=null,info={};
        v.render(()=>{
          const p=pS.value,n=nS.value;
          if(cache?.p!==p)cache={p,right:range(151).map(i=>[2*i+1,juryProbability(2*i+1,p).right]),opposite:range(151).map(i=>[2*i+1,juryProbability(2*i+1,1-p).right]),bound:p>.5?range(151).map(i=>[2*i+1,juryLowerBound(2*i+1,p)]):[]};
          A.path(cache.right,{color:'accent',width:2.4});A.path(cache.opposite,{color:'red',width:1.7});
          if(cache.bound.length)A.path(cache.bound,{color:'ink',width:1.5,dash:true});
          A.line(1,.5,301,.5,{color:'faint',dash:true});
          const q=juryProbability(n,p),op=juryProbability(n,1-p);
          A.dot(n,q.right,{color:'accent',r:5});A.dot(n,op.right,{color:'red',r:3.6});
          const masses=juryMass(n,p),maximum=Math.max(...masses),pad=Math.max(.015,maximum*.12);
          B.setView([-1.5,n+1.5],[-pad,maximum+pad]);
          masses.forEach((mass,k)=>B.rect(k-.4,0,k+.4,mass,{fill:k>n/2?'green':'accent',fillAlpha:.8,stroke:false}));
          B.line(n/2,0,n/2,maximum,{color:'ink',dash:true});
          info={n,p,...q,bound:juryLowerBound(n,p),masses,maximum};
        });
        v.legend([['accent','competence $p$'],['red','competence $1-p$'],['ink','variance lower bound',{dash:true}],['green','correct majority outcomes',{area:true}]]);
        v.readout(()=>`Odd $n=${info.n}$; $p=${v.fix(info.p,3)}$. Majority right: **${juryNumber(info.right,info.logRight)}**. Majority wrong: **${juryNumber(info.wrong,info.logWrong)}**. ${info.bound===null?'The displayed lower bound applies only for $p>1/2$.':`Variance lower bound: ${v.fix(info.bound,6)}.`} ${info.p===.5?'Fair votes give exactly one half for every odd size.':info.p===0||info.p===1?'Deterministic competence gives this exact endpoint at every size.':'These are finite probabilities, not certainty at this size.'}`);
      },
    },

    // ───────────────────────────────────────────────────────────── 5.5
    {
      num: '5.5',
      kind: 'Model',
      name: 'Correlated voters and a shared leader',
      statement: String.raw`This authored dependence model fixes two alternatives with exactly one correct, $1/2<p<1$, and odd $n$. A shared leader is correct with probability $p$. Independently for each voter, with probability $\rho\in[0,1]$ the voter copies the leader; otherwise an independent private vote is correct with probability $p$. The leader is not an extra counted voter. Every counted voter still has marginal accuracy $p$.

Conditional on the leader being correct or wrong, the votes are independent with respective accuracies $q_1=\rho+(1-\rho)p$ and $q_0=(1-\rho)p$. Thus
$$\begin{aligned}P_n^{\rm leader}&=pP_n(q_1)\\&\quad+(1-p)P_n(q_0).\end{aligned}$$
Writing $\rho^*=1-1/(2p)$, its limit along odd $n$ is
$$\begin{gathered}L=\lim P_n^{\rm leader},\\L=\begin{cases}1,&\rho<\rho^*,\\(1+p)/2,&\rho=\rho^*,\\p,&\rho>\rho^*.\end{cases}\end{gathered}$$
For distinct voters their pairwise correlation is $\rho^2$, not $\rho$. Positive dependence can therefore coexist with limiting accuracy one in this particular family.`,
      idea: String.raw`Average over the two cells defined by the leader’s correctness, using finite-partition conditional expectation (prob-4.1.1a). Their probabilities are $p$ and $1-p$. Since $q_1>1/2$, polsci-5.4 sends the first conditional accuracy to one. The second tends to one, one half or zero according as $q_0$ is above, equal to or below one half. Equality is a separate case, not a rounded neighbourhood of the threshold.

For distinct correct-vote indicators, conditional independence gives $E(X_iX_j)=p q_1^2+(1-p)q_0^2$. Subtracting $p^2$ gives covariance $\rho^2p(1-p)$; division by their common variance $p(1-p)>0$ yields correlation $\rho^2$. This model demonstrates one specific way shared information can obstruct aggregation, without a general claim about all correlated electorates.`,
      caption: String.raw`Left: the exact finite mixture against odd jury size, its limit, and the independent comparison. Right: finite accuracy against following probability, with the two open endpoints and the filled value of the discontinuous limit at $\rho^*$. Choose “exact critical case” to set $\rho=\rho^*$ analytically; the disabled manual slider is then unused. The finite blue curve remains continuous at the jump in the infinite-jury limit.`,
      deps: ['polsci-5.4', 'prob-4.1.1a'],
      see: ['polsci-5.8', 'soc-7.3'],
      refs: ['Authored common-leader construction and conditional-probability derivation; independent comparison: Easley and Kleinberg (2010), §23.7'],
      tags: ['jury theorem', 'correlation'],
      scope: String.raw`The curves are calculated probabilities in an authored model, not observed voting data and not a model attributed to Ladha. Private votes, copying indicators and leader correctness are mutually independent before votes are combined. Dependence is unconditional; it disappears on conditioning on the leader. This is neither a theorem about arbitrary correlations nor a sequential information cascade. Manual sliders offer $p=0.550$–$0.900$ and $\rho=0$–$1$; exact critical mode supplies every threshold even when it is off the manual grid.`,
      verify: false,
      links: { source: 'https://www.cs.cornell.edu/home/kleinber/networks-book/networks-book-ch23.pdf' },
      viz(v) {
        const A=v.stage({x:[-16,418],y:[-.08,1.09],axes:'box',gutter:true,height:330,minWidth:300,xlabel:'odd jury size $n$',ylabel:'probability majority is right',title:'finite common-leader mixture'});
        const B=v.stage({x:[-.055,1.055],y:[-.08,1.09],axes:'box',gutter:true,height:330,minWidth:300,xlabel:'following probability $\\rho$',ylabel:'probability majority is right',title:'finite accuracy and infinite limit'});
        const pS=v.slider('competence $p$',.55,.9,.7,{step:.005,decimals:3,onChange:x=>assertJurySliderTick(x,200)});
        const rS=v.slider('manual following $\\rho$',0,1,.4,{step:.01,decimals:2,onChange:x=>assertJurySliderTick(x,100)});
        const nS=v.slider('odd jury size $n$',1,401,101,{int:true,step:2,onChange:assertOddJurySize});
        const mode=v.select('following parameter',[{value:'manual',label:'manual following'},{value:'critical',label:'exact critical case'}],'manual');
        let cache=null,info={};
        v.render(()=>{
          const p=pS.value,n=nS.value,manual=rS.value,critical=mode.value==='critical',q=juryLeader(n,p,manual,critical),key=`${p}|${manual}|${critical}|${n}`;
          rS.input.disabled=critical;
          if(cache?.key!==key)cache={key,growth:range(201).map(i=>[2*i+1,juryLeader(2*i+1,p,manual,critical).right]),independent:range(201).map(i=>[2*i+1,juryProbability(2*i+1,p).right]),following:[...range(101).map(i=>i/100),q.threshold].sort((a,b)=>a-b).map(r=>[r,juryLeader(n,p,r,r===q.threshold).right])};
          A.path(cache.independent,{color:'muted',width:1.6,dash:true});A.path(cache.growth,{color:'accent',width:2.4});
          A.line(1,q.limit,401,q.limit,{color:'red',width:1.6,dash:true});A.dot(n,q.right,{color:'accent',r:5});
          B.path(cache.following,{color:'accent',width:2.4});
          // Draw the larger selection first so the exact limiting markers remain visible at coincidences.
          B.dot(q.rho,q.right,{color:'gold',r:6});
          B.line(0,1,q.threshold,1,{color:'red',width:2});B.line(q.threshold,p,1,p,{color:'red',width:2});
          B.dot(q.threshold,1,{color:'red',r:4,hollow:true});B.dot(q.threshold,p,{color:'red',r:4,hollow:true});
          B.dot(q.threshold,(1+p)/2,{color:'red',r:4});
          info=q;
        });
        v.legend([['accent','finite majority accuracy'],['muted','independent comparison',{dash:true}],['red','infinite-jury limit'],['gold','chosen following',{dot:true}]]);
        v.readout(()=>`$p=${v.fix(info.p,3)}$, odd $n=${info.n}$. ${info.critical?'**Exact critical case:** ':''}$\\rho=${v.fix(info.rho,6)}$ ${info.critical?'(rounded here; analytically equal to $\\rho^*$)':''}; $\\rho^*=${v.fix(info.threshold,6)}$. Conditional accuracies: $q_1=${v.fix(info.q1,6)}$, $q_0=${v.fix(info.q0,6)}$. Majority right: **${juryNumber(info.right,info.logRight)}**; wrong: ${juryNumber(info.wrong,info.logWrong)}. Limit: **${v.fix(info.limit,6)}** ${info.relation===0?'at the exact threshold':info.relation>0?'below the threshold, despite dependence when following is positive':'above the threshold, the leader’s accuracy'}. Pairwise correlation $\\rho^2=${v.fix(info.correlation,6)}$.`);
      },
    },
  ],
};
