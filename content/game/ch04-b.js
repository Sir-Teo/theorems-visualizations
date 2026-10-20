// Game Theory & Social Choice — Chapter 4 (part b): centipede, ultimatum, chain store, imperfect information, Kuhn's theorem
import {
  idx, leaf, dec, isLeaf, prep, playBeh, infoSets, pureStrategies, stratName, drawTree, treeView, nmz, kuhnBehaviour, mixedOutcome,
} from './ch04.shared.js';
import { assertUltimatumAlphaTick, centipedeModel, ultimatumModel } from './source-audit-centipede-ultimatum.js';

// ---------------------------------------------------------------- chain store (reputation) helpers
const EQ = 1e-9;
/** Entrant enters with probability e; the weak monopolist fights an entrant with probability s. k = towns left, p = belief "tough". */
function chainStrat(k, p) {
  const thr = 2 ** -k;
  if (p > thr * (1 + EQ)) { if (k === 1) return { e: 0, s: 0 }; const q = Math.min(1, p * 2 ** (k - 1)); return { e: 0, s: (q - p) / (1 - p) }; }
  if (p < thr * (1 - EQ)) { const q = Math.min(1, p * 2 ** (k - 1)); return { e: 1, s: (q - p) / (1 - p) }; }
  return { e: 1 / 3, s: (0.5 - p) / (1 - p) };
}
function chainValue(k, p) {
  if (k === 0) return 0;
  const { e, s } = chainStrat(k, p), q = p + (1 - p) * s;
  const out = 5 + chainValue(k - 1, p), acc = 2 + 2 * (k - 1), fight = q > 0 ? chainValue(k - 1, p / q) : 0;
  return (1 - e) * out + e * (s * fight + (1 - s) * acc);
}
/** For a weak monopolist: probability that town t (1..K) is entered, in equilibrium, plus expected payoff. */
function chainEntry(K, p0) {
  const ent = new Array(K + 1).fill(0), fightP = new Array(K + 1).fill(0);
  const go = (k, p, mass) => {
    if (k === 0 || mass < 1e-15) return;
    const t = K - k + 1, { e, s } = chainStrat(k, p), q = p + (1 - p) * s;
    ent[t] += mass * e; fightP[t] += mass * e * s;
    for (let r = 1; r < k; r++) ent[t + r] += mass * e * (1 - s);           // accommodated once: revealed weak, later entrants all enter
    if (e < 1) go(k - 1, p, mass * (1 - e));
    if (e > 0 && s > 0 && q > 0) go(k - 1, p / q, mass * e * s);
  };
  go(K, p0, 1);
  return { ent, fightP, value: chainValue(K, p0) };
}

export default {
  collection: 'game',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num:'4.6',kind:'Paradox',name:'Centipede game',
      statement:String.raw`Two players alternate at $n$ observed decision nodes. Taking at node $m$ gives its mover $4\cdot2^{m-1}$ and the other player $2^{m-1}$, in authored money units. Passing doubles both piles and changes the mover. If all $n$ nodes are passed, a fixed terminal leaf pays the same formula at index $n+1$, with the next player assigned the larger pile; there is no extra decision there.

With these payoffs, finite horizon and each player maximizing her own money, the unique subgame perfect plan takes at every decision node, including off-path nodes. Its initial outcome is $(4,1)$, although the all-pass terminal payoff is larger for both players for every offered $n\ge2$. This is a contrast between the model's equilibrium and available payoffs, not a logical contradiction.

McKelvey and Palfrey's **1991 working-paper version** reports laboratory play that often continued beyond the first node. Their four- and six-move designs start at $(0.40,0.10)$ and double the piles. This widget scales those base payoffs by ten and also offers other lengths; its reasoning levels are authored examples, not their observed choices or fitted explanation.`,
      idea:String.raw`At the last node, taking gives its mover $4\cdot2^{n-1}$ while passing gives her $2^n$, so taking is strictly better. If the next mover takes, passing at any earlier node similarly gives only $2^m$, compared with $4\cdot2^{m-1}$ from taking now. Backward induction (game-4.2) therefore selects take at every node. The single-node criterion in game-4.4 verifies the whole plan, not just the initial path.

The separate level rule sets level 0 to pass everywhere. Level $k\ge1$ chooses a complete best-response plan against an opponent of level $k-1$, optimizing its own future choices too and passing on exact indifference. An actual pair of levels then plays its two prescribed plans. The opponent used to construct a plan need not equal the actual opponent. For example, with ten nodes, levels $(9,0)$ stop at node 3. This is neither a monotone measure of cooperation nor a solution of the incomplete-information model in the source.`,
      caption:String.raw`The left panel inspects one node and its immediate take/payoff or pass continuation **under the selected complete plans**. Use previous/next, root, or played outcome to inspect every decision and the final all-pass leaf. The right grid retains all levels 0–10 for both players, independently of game length; click a cell or use the two level sliders. Each cell gives the terminal index, with $n+1$ meaning all pass. Gold marks the action prescribed by the selected plans; the readout lists their off-path choices and any profitable one-node deviations.`,
      deps:['game-4.2','game-4.4'],refs:['McKelvey & Palfrey, Social Science Working Paper 732, revised August 1991, §§1–3 and Figures 1–2'],
      credit:'McKelvey & Palfrey, 1991 working paper (experimental comparison); authored finite-level illustration',
      scope:String.raw`Finite deterministic perfect-information game, arbitrary money units and selfish preferences. The source study used student subjects from Caltech and Pasadena Community College with repeated, differently matched plays; the widget contains no subject data. No historical first-invention or epistemic common-knowledge theorem is asserted.`,
      tags:['centipede','backward induction','complete plans'],links:{source:'https://authors.library.caltech.edu/records/n6131-v8q36'},verify: false,
      viz(v){
        let inspect=1,info;
        const n=v.slider('number of decision nodes $n$',2,10,6,{int:true,onChange:x=>{inspect=Math.min(inspect,x+1);}}),a=v.slider('player 1 reasoning level',0,10,2,{int:true}),b=v.slider('player 2 reasoning level',0,10,2,{int:true});
        v.button('inspect root',()=>{inspect=1;});v.button('previous node',()=>{inspect=Math.max(1,inspect-1);});v.button('next node',()=>{inspect=Math.min(n.value+1,inspect+1);});v.button('inspect played outcome',()=>{inspect=centipedeModel(n.value,a.value,b.value).stop;});
        v.shareState('centipede inspected index',{get:()=>({nodes:n.value,index:inspect}),validate:d=>!!d&&Number.isInteger(d.nodes)&&d.nodes>=2&&d.nodes<=10&&Number.isInteger(d.index)&&d.index>=1&&d.index<=d.nodes+1,set:d=>{n.set(d.nodes);inspect=d.index;}});
        const A=v.stage({x:[-2.1,2.1],y:[-1.5,1.7],height:350,minWidth:280,axes:false,title:'selected subgame and prescribed continuation'}),B=v.stage({x:[-.8,11.8],y:[-.8,12.5],height:360,minWidth:280,equal:true,axes:false,title:'terminal index for all level pairs'});
        B.onClick((x,y)=>{const j=Math.floor(x),i=10-Math.floor(y);if(i>=0&&i<=10&&j>=0&&j<=10){a.set(i);b.set(j);}});
        v.legend([['blue','player 1'],['orange','player 2'],['gold','prescribed action'],['green','all pass'],['red','stop at node 1']]);
        v.render(()=>{inspect=Math.min(inspect,n.value+1);const p=centipedeModel(n.value,a.value,b.value,inspect);info=p;
          if(inspect===p.n+1){A.text(`terminal ${inspect}: all pass`,0,1.1,{align:'center',size:14,weight:700});A.text(`(${p.full.join(', ')})`,0,.3,{align:'center',size:20,weight:700,color:'green'});A.text('No decision remains.',0,-.45,{align:'center',size:13,color:'muted'});}
          else{const q=p.continuations[inspect-1],col=q.who?'orange':'blue';A.text(`node ${inspect} / ${p.n}: player ${q.who+1}`,0,1.35,{align:'center',size:13,weight:700,color:col});A.dot(0,.85,{r:11,color:col});
            A.arrow(-.08,.7,-1.05,-.25,{color:q.selected?'gold':'muted',width:q.selected?3:1.5,head:8});A.arrow(.08,.7,1.05,-.25,{color:!q.selected?'gold':'muted',width:!q.selected?3:1.5,head:8});
            A.text('Take',-1.12,.4,{align:'center',size:13,weight:700,color:q.selected?'gold':'ink'});A.text('Pass',1.12,.4,{align:'center',size:13,weight:700,color:!q.selected?'gold':'ink'});
            A.text(`(${q.take.join(', ')})`,-1.05,-.55,{align:'center',size:14,weight:700});A.text(`(${q.pass.join(', ')})`,1.05,-.55,{align:'center',size:14,weight:700});A.text(`stop ${q.m}`,-1.05,-.9,{align:'center',size:12,color:'muted'});A.text(`stop ${q.passStop}`,1.05,-.9,{align:'center',size:12,color:'muted'});A.text('Payoffs: player 1, player 2',0,-1.25,{align:'center',size:12,color:'muted'});}
          for(let i=0;i<=10;i++)for(let j=0;j<=10;j++){const stop=p.grid[i][j],selected=i===p.a&&j===p.b;B.rect(j,10-i,j+1,11-i,{fill:stop===1?'red':stop===p.n+1?'green':'gold',fillAlpha:.2,color:selected?'ink':'faint',width:selected?2.5:.6});B.text(String(stop),j+.5,10.5-i,{align:'center',baseline:'middle',size:11,weight:selected?800:500});}
          for(let i=0;i<=10;i++){B.text(String(i),-.25,10.5-i,{align:'right',baseline:'middle',size:10,color:'blue'});B.text(String(i),i+.5,11.35,{align:'center',size:10,color:'orange'});}B.text('player 2 level',5.5,12,{align:'center',size:12,color:'orange',weight:700});B.text('player 1 levels down the rows',5.5,-.45,{align:'center',size:11,color:'blue'});
        });
        v.readout(()=>{if(!info)return'';const p=info,plan=who=>p.plans[who].flatMap((take,j)=>j%2===who?[`${j+1}:${take?'T':'P'}`]:[]).join(' ');return `Actual levels (${p.a}, ${p.b}); terminal ${p.stop}${p.stop===p.n+1?' (all pass)':''}, payoffs (${p.pay.join(', ')}). Full all-pass leaf: (${p.full.join(', ')}).\nComplete P1 plan: ${plan(0)}. Complete P2 plan: ${plan(1)}. T=take, P=pass. Pure strategy counts ${p.strategyCounts.join(' × ')}.\nProfitable single-node deviations in this profile: ${p.violations.length?p.violations.join(', '):'none (a pure SPE)'}. Backward induction takes at every node and initially pays (4, 1). Inspecting index ${p.inspect}.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num:'4.7',kind:'Model',name:'Ultimatum game',
      statement:String.raw`A proposer offers an integer $x\in\{0,\ldots,10\}$ from a pie of 10. The responder observes it and accepts, yielding money $(10-x,x)$, or rejects, yielding $(0,0)$. Her pure strategy specifies a decision after **every** possible offer. With both players maximizing only their own money, she strictly accepts every positive offer and is indifferent at zero. There are exactly two **pure** subgame perfect profiles: accept zero and offer zero; or reject zero and offer one. Mixed equilibria are not classified here.

For a separately specified acceptance probability $F(x)$, a selfish proposer maximizes $(10-x)F(x)$ over all 11 offers; every maximizing offer is retained. Such a response rule is an input, not automatically a money-payoff equilibrium. Güth, Schmittberger and Schwarze's 1982 paper experimentally studied money-division and chip-allocation bargaining. The displayed pie, response populations and probabilities are authored, with no experimental frequencies imported.`,
      idea:String.raw`Subgame perfection (game-4.4) first checks the responder's choice at all 11 histories. Positive money beats zero, while both actions are best replies at offer zero. The proposer then picks the least costly accepted offer, giving the two pure-money profiles above. A fixed threshold $m$ accepts exactly when $x\ge m$; $m=11$ means no offer is accepted, so all offers yield zero and all tie.

The authored population is uniform over integer thresholds from $\max(0,\mu-w)$ through $\min(11,\mu+w)$ inclusive. The proposer knows this distribution, but not the selected responder's threshold. Thus $F(x)$ is the exact accepted-type count divided by the support size. It is neither an estimated normal distribution nor evidence about fairness.

The inequity mode specializes Fehr–Schmidt's two-player utility to a selfish proposer and responder with disadvantage weight $\alpha\ge0$ and advantage weight $\beta=0$:
$$U_R(x)=x-\alpha\max(10-2x,0).$$
Rejection has utility zero. With acceptance on indifference, accept exactly when $x\ge10\alpha/(1+2\alpha)$; the smallest accepted **integer** offer is optimal for this selfish proposer. The continuous threshold is below 5 for finite $\alpha$, while integer rounding can make the offer 5. This mode is one parameter slice, not the whole Fehr–Schmidt model or a fit to subjects.`,
      caption:String.raw`Compare all 11 offers: left, proposer expected money; right, acceptance probability. Every gold bar is a best offer, including exact ties. In money mode, choose whether the responder accepts zero to inspect both pure SPE. Fixed threshold and uniform threshold population are exogenous response rules; threshold 11 is “never accept.” The inequity mode uses the utility and tie rule above. Hidden controls keep their saved values but do not enter the active rule.`,
      deps:['game-4.4'],refs:['Güth, Schmittberger & Schwarze (1982), §§1–2, especially §2.1','Fehr & Schmidt (1999), Eq. (2), §III.A/Proposition 1 and footnote 8'],
      credit:'Güth, Schmittberger & Schwarze, 1982 (experiment); Fehr & Schmidt, 1999 (utility model)',
      scope:String.raw`Finite integer offers and a money-maximizing proposer. The fixed/population thresholds are authored commitments or reduced-form response rules, not claims that money-only responders rationally reject positive money. No observed offer distribution or universal fairness inference is shown.`,
      tags:['bargaining','subgame perfection','response rules'],links:{source:'http://www.dklevine.com/archive/refs4291.pdf',utility:'https://web.stanford.edu/~niederle/Fehr.Schmidt.1999.QJE.pdf'},verify: false,
      viz(v){
        let info;const mode=v.select('response rule',[{value:'money',label:'money only'},{value:'threshold',label:'fixed threshold'},{value:'population',label:'uniform threshold population'},{value:'inequity',label:'inequity utility'}],'money',{onChange:()=>visible()});
        const mu=v.slider(String.raw`threshold / population center $\mu$`,0,11,3,{int:true}),width=v.slider('population half-width $w$',0,5,2,{int:true}),alpha=v.slider(String.raw`disadvantage weight $\alpha$`,0,4,1,{step:.25,decimals:2,onChange:assertUltimatumAlphaTick}),zero=v.select('money-only tie at zero',[{value:'accept',label:'accept zero'},{value:'reject',label:'reject zero'}],'accept');
        const visible=()=>{mu.el.hidden=!['threshold','population'].includes(mode.value);width.el.hidden=mode.value!=='population';alpha.el.hidden=mode.value!=='inequity';zero.el.hidden=mode.value!=='money';};visible();
        const L=v.stage({x:[-.65,10.65],y:[-.55,11],height:340,minWidth:280,axes:'box',gutter:true,xticks:idx(11),xlabel:'offer to responder',ylabel:'proposer expected money',title:'all offers; gold marks every best offer'}),R=v.stage({x:[-.65,10.65],y:[-.08,1.12],height:340,minWidth:280,axes:'box',gutter:true,xticks:idx(11),yticks:[0,.25,.5,.75,1],xlabel:'offer to responder',ylabel:'acceptance probability',title:'authored response rule'});
        v.legend([['blue','other offers'],['gold','all best offers'],['green','acceptance probability']]);
        v.render(()=>{const p=ultimatumModel(mode.value,mu.value,width.value,alpha.value,zero.value);info=p;for(let x=0;x<=10;x++){const best=p.bestOffers.includes(x);L.rect(x-.34,0,x+.34,p.profits[x],{fill:best?'gold':'blue',fillAlpha:.35,color:best?'gold':'blue',width:1.5});R.rect(x-.34,0,x+.34,p.probabilities[x],{fill:'green',fillAlpha:.3,color:'green',width:1.5});}});
        v.readout(()=>{if(!info)return'';const p=info,details=p.mode==='population'?`Uniform threshold support: ${p.support.join(', ')}; each has weight 1/${p.denominator}.`:p.mode==='threshold'?`Fixed threshold ${p.mu}${p.mu===11?' (never accept)':''}.`:p.mode==='inequity'?`Responder β=0, α=${p.alpha}; real threshold ${v.fix(p.realThreshold,6)}, accepted integer offers ${p.numerators.flatMap((k,x)=>k?[x]:[]).join(', ')}; accept on utility ties.`:`Money-only responder ${p.zero==='accept'?'accepts':'rejects'} zero and accepts every positive offer.`;return `${details}\nBest offers: ${p.bestOffers.join(', ')}. Proposer expected money ${v.fix(p.best,6)}. Responder expected money at these offers: ${p.bestOffers.map(x=>`${x}→${v.fix(p.responderMoney[x],4)}`).join('; ')}.\nThe two pure-money SPE are offer 0 / accept 0 and offer 1 / reject 0, with acceptance of all positive offers in both. Other modes are explicitly specified utilities or authored response rules, not observed experimental frequencies.`;});
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Paradox',
      name: 'Chain-store paradox',
      statement: String.raw`A monopolist owns stores in $K$ towns, and in each town in turn a different potential entrant chooses *Out* (entrant 1, monopolist 5) or *In*; if she enters the monopolist either **accommodates** (2, 2) or **fights** (0, 0). The payoffs here are an illustration in the style of Selten’s example. Fighting is bad for the monopolist after entry, so backward induction (game-4.2) gives: in the last town she accommodates; hence the entrant there enters; hence the second-last fight cannot deter anything, and so on. The unique subgame perfect equilibrium has every entrant enter and every entry accommodated, although the monopolist would like to be known as a fighter.`,
      idea: String.raw`The argument starts from the last town, where reputation is worth nothing, and the unravelling cannot be stopped by any earlier fight. Selten found the conclusion unconvincing as a description of behaviour. Kreps–Wilson and Milgrom–Roberts resolved it with a little incomplete information: with prior probability $p_0$ the monopolist is a “tough” type who always fights. Then a weak monopolist fights early to be taken for the tough type. In the equilibrium computed here entrants stay out until about $\log_2(1/p_0)$ towns remain, and the entry that does occur is mixed.`,
      caption: String.raw`Bars: the probability that each town is entered in equilibrium (for the weak monopolist), compared with the backward-induction prediction (entry in every town, grey line). Raise the number of towns $K$ or the prior $p_0$ of the tough type: the entry-free stretch grows. The right plot shows the weak monopolist’s average payoff per town as $K$ grows: it climbs far above the backward-induction value $2$. Equilibrium computed by the recursion in the idea above (own derivation for these payoffs, checked by one-shot-deviation tests).`,
      credit: 'Selten, 1978; Kreps & Wilson, 1982; Milgrom & Roberts, 1982',
      scope: String.raw`Simplified payoffs; the tough type fights every entrant; entrants live one period and maximise their own payoff; equilibrium is sequential (beliefs by Bayes’ rule).`,
      deps: ['game-4.2'],
      refs: ['Osborne §7.2'],
      tags: ['paradox', 'reputation', 'entry deterrence'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Chain_store_paradox' },
      verify: true,
      viz(v) {
        const L = v.stage({ x: [0.3, 20.7], y: [0, 1.15], axes: 'box', gutter: true, height: 320, xlabel: 'town (in order of play)', ylabel: 'probability of entry', title: 'who enters in equilibrium' });
        const R = v.stage({ x: [1, 20], y: [1.5, 5.3], axes: 'box', gutter: true, height: 320, weight: 0.7, xlabel: 'number of towns $K$', ylabel: 'monopolist’s payoff per town', title: 'value of a reputation' });
        const sK = v.slider('number of towns $K$', 1, 20, 12, { int: true });
        const sp = v.slider('prior probability of the tough type $p_0$', 0.002, 0.5, 0.05, { log: true, sig: 2 });
        let info;
        v.render(() => {
          const K = sK.value, p0 = sp.value, r = chainEntry(K, p0);
          L.setView([0.3, Math.max(K, 3) + 0.7], [0, 1.15]);
          L.line(0.3, 1, K + 0.7, 1, { color: 'faint', dash: true });
          for (let t = 1; t <= K; t++) {
            L.rect(t - 0.34, 0, t + 0.34, Math.min(1, r.ent[t]), { fill: 'gold', fillAlpha: 0.4, color: 'gold', width: 1.5 });
            L.dot(t, 1, { r: 3.5, color: 'muted' });
          }
          L.text('backward induction: every town enters', Math.max(K, 3) + 0.6, 1.07, { align: 'right', size: 11.5, color: 'muted', weight: 600 });
          R.setView([1, 20], [1.5, 5.3]);
          R.hline(2, { color: 'muted', dash: true }); R.text('backward induction', 19.8, 1.88, { align: 'right', size: 11.5, color: 'muted', weight: 600, plate: true });
          R.hline(5, { color: 'muted', dash: true }); R.text('no entry at all', 19.8, 5.05, { align: 'right', size: 11.5, color: 'muted', weight: 600, plate: true });
          const pts = idx(20).map((i) => [i + 1, chainValue(i + 1, p0) / (i + 1)]);
          R.path(pts, { color: 'green', width: 2.5 }); R.dot(K, chainValue(K, p0) / K, { r: 6, color: 'gold' });
          info = { K, p0, r };
        });
        v.readout(() => {
          const { K, p0, r } = info, ent = r.ent.slice(1).reduce((a, b) => a + Math.min(1, b), 0);
          const first = r.ent.findIndex((x, i) => i > 0 && x > 1e-9);
          return `expected number of entered towns: ${v.fix(ent, 2)} of ${K}${first > 0 ? `, entry first possible at town ${first} (the last ${K - first + 1} towns)` : ', none'}; expected payoff for the weak monopolist ${v.fix(r.value, 2)} against $2K=${2 * K}$ without reputation\nrule of thumb: with $p_0=${v.fix(p0, 3)}$ entry is deterred while more than $\\log_2(1/p_0)\\approx${v.fix(Math.log2(1 / p0), 1)}$ towns remain`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Definition',
      name: 'Imperfect information: information sets and behaviour strategies',
      statement: String.raw`In an extensive game with **imperfect information** the decision nodes of a player are partitioned into **information sets**: the player knows only which set she is in, so the same actions must be available at all of its nodes and her choice cannot depend on which node it is. Chance moves are nodes of a nature player with given probabilities. A **pure strategy** chooses one action in every information set, a **mixed strategy** is a probability distribution over pure strategies, and a **behaviour strategy** chooses, independently in each information set, a probability distribution over its actions. A profile of behaviour strategies fixes the probability of every leaf (product of the probabilities along its path) and hence expected payoffs. The game has **perfect recall** if no player forgets what she knew or did earlier.`,
      idea: String.raw`Information sets are the tree’s way of saying “I cannot tell these histories apart”. They destroy backward induction in the form of game-4.2, since a mover at a set cannot condition on the node. A behaviour strategy needs one probability per action per information set, far fewer numbers than a mixed strategy over exponentially many pure strategies; Kuhn’s theorem (game-4.10) says that under perfect recall nothing is lost by using them. Every simultaneous game is an imperfect-information game: the second mover’s two nodes form one information set.`,
      caption: String.raw`Pick a game and set the behaviour strategies with the sliders (each is the probability of the first listed action at the information set of that letter). Dashed bars join nodes of one information set. Edge labels show the probabilities you chose, grey numbers under the leaves the probability of reaching them. In the poker game, the button “equilibrium” sets the strategies that make both players indifferent; try deviating from them and watch the value move.`,
      credit: 'Kuhn, 1950–53',
      deps: ['game-4.1', 'game-2.1'],
      refs: ['MSZ §6.1', 'Osborne §10.1'],
      tags: ['information set', 'behaviour strategy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Information_set_(game_theory)' },
      verify: true,
      viz(v) {
        const MK = {
          mp: () => dec(1, [['Heads', dec(2, [['Heads', leaf(1, -1)], ['Tails', leaf(-1, 1)]], 'B')], ['Tails', dec(2, [['Heads', leaf(-1, 1)], ['Tails', leaf(1, -1)]], 'B')]], 'A'),
          poker: () => dec(0, [['High', dec(1, [['Bet', dec(2, [['Call', leaf(2, -2)], ['Fold', leaf(1, -1)]], 'C')], ['Check', leaf(1, -1)]], 'A'), 0.5], ['Low', dec(1, [['Bet', dec(2, [['Call', leaf(-2, 2)], ['Fold', leaf(1, -1)]], 'C')], ['Check', leaf(-1, 1)]], 'B'), 0.5]]),
        };
        let key = 'mp', P = prep(MK.mp());
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, title: 'game tree with information sets' });
        const sl = ['A', 'B', 'C'].map((k, i) => v.slider(`information set ${k}: probability of the first action`, 0, 1, 0.5, { step: 0.05 }));
        const setup = () => { P = prep(MK[key]()); sl.forEach((s, i) => { s.el.hidden = !infoSets(P, 1).concat(infoSets(P, 2)).some((I) => I.key === 'ABC'[i]); }); };
        v.select('game', [{ value: 'mp', label: 'Matching Pennies as a tree' }, { value: 'poker', label: 'one-card poker' }], key, { onChange: (k) => { key = k; setup(); } });
        v.button('equilibrium', () => { if (key === 'mp') sl.forEach((s) => s.set(0.5)); else { sl[0].set(1); sl[1].set(1 / 3); sl[2].set(2 / 3); } });
        setup();
        let info;
        v.render(() => {
          const beh = {};
          [...infoSets(P, 1), ...infoSets(P, 2)].forEach((I) => { const p = sl['ABC'.indexOf(I.key)].value; beh[I.key] = [p, 1 - p]; });
          const r = playBeh(P, beh), vw = treeView(P); T.setView(vw.x, vw.y);
          drawTree(T, P, {
            edgeLabel: (e) => (e.from.p === 0 ? `${e.a} ${e.pr}` : `${e.a} ${v.fix(beh[e.from.key][e.i], 2)}`),
            leafNote: (n) => `prob ${v.fix(r.leafP.get(n) || 0, 3)}`,
            edgeWidth: (e) => (e.from.p === 0 ? 2 : 1.4 + 4 * (beh[e.from.key][e.i] || 0)),
            nodeTag: (n) => (n.p === 0 ? 'nature' : `${n.p} · ${n.key}`),
          });
          info = { r, beh };
        });
        v.readout(() => {
          const { r } = info, S1 = pureStrategies(P, 1).length, S2 = pureStrategies(P, 2).length;
          const nb = infoSets(P, 1).concat(infoSets(P, 2)).length;
          return `expected payoffs $(${nmz(r.u[0])},\\,${nmz(r.u[1])})$ = sum over leaves of (reach probability) × (payoff)\nplayer 1 has ${S1} pure strategies, player 2 has ${S2}; a behaviour profile needs only ${nb} numbers (one per information set of this tree)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Theorem',
      name: 'Kuhn’s theorem: behaviour and mixed strategies under perfect recall',
      statement: String.raw`In a finite extensive game in which a player has **perfect recall**, every mixed strategy of that player is **outcome-equivalent** to a behaviour strategy: whatever the others do, both induce the same probability distribution over leaves. Conversely every behaviour strategy is equivalent to a mixed one. Hence in games of perfect recall one may restrict to behaviour strategies without changing the set of achievable outcome distributions or the equilibria payoffs. Without perfect recall this fails.`,
      idea: String.raw`Given a mixed strategy $\mu$, define the behaviour probability of action $a$ at an information set $I$ as the probability, under $\mu$, of choosing $a$ conditional on the player’s own earlier choices on the way to $I$ (the same for every node of $I$, by perfect recall). Because the player’s own choices on the path to a leaf are independent coordinates of a pure strategy, the probability of a leaf under $\mu$ factorises into these conditional probabilities times the others’ moves and nature’s, which is exactly the behaviour-strategy probability. With imperfect recall, as for the absent-minded driver, one information set contains two nodes on the same path and the factorisation breaks.`,
      caption: String.raw`Left, “perfect recall”: player 1 mixes over her 16 pure strategies with random weights (re-roll with the button, or change how concentrated they are). Kuhn’s formula turns the mixture into probabilities on player 1’s edges (shown: the probability of the first action, $a$ or $U$, at each of her information sets, and of the second one on the other edge). The bars compare the leaf distribution of the original mixture with the distribution of the behaviour strategy, and they agree to machine precision. Right, “absent-minded driver”: exit at the first or second junction without remembering which. Mixed strategies give at most payoff $1$, behaviour strategies reach $4/3$ at $p=2/3$.`,
      credit: 'Kuhn, 1953 (absent-minded driver: Piccione & Rubinstein, 1997)',
      scope: String.raw`Finite games with perfect recall; the theorem concerns one player’s strategies at a time and holds for any behaviour of the others.`,
      deps: ['game-4.9'],
      refs: ['MSZ §6.2'],
      tags: ['perfect recall', 'behaviour strategy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perfect_recall_(game_theory)' },
      verify: true,
      viz(v) {
        const mkPR = () => dec(1, [
          ['U', dec(2, [['l', dec(1, [['a', leaf(3, -3)], ['b', leaf(0, 0)]], 'B')], ['r', dec(1, [['a', leaf(1, -1)], ['b', leaf(4, -4)]], 'C')]], 'X')],
          ['D', dec(2, [['l', dec(1, [['a', leaf(2, -2)], ['b', leaf(-1, 1)]], 'E')], ['r', dec(1, [['a', leaf(2, -2)], ['b', leaf(-1, 1)]], 'E')]], 'Y')],
        ], 'A');
        const mkAM = () => dec(1, [['exit', leaf(0, 0)], ['continue', dec(1, [['exit', leaf(4, 0)], ['continue', leaf(1, 0)]], 'D')]], 'D');
        // The driver's first and second nodes form ONE information set 'D'
        let mode = 'pr', P = prep(mkPR()), S = pureStrategies(P, 1), seed = 5, mu = null;
        const T = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 1.15, title: 'game tree (player 1 is the one who mixes)' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 0.85, title: 'outcome distributions' });
        const conc = v.slider('concentration of the mixture', 0.15, 3, 0.7, { step: 0.05, onChange: () => draw0() });
        const q2 = v.slider('player 2 plays $l$ at $X$ with probability', 0, 1, 0.5, { step: 0.05 });
        const q3 = v.slider('player 2 plays $l$ at $Y$ with probability', 0, 1, 0.3, { step: 0.05 });
        const pd = v.slider('driver continues with probability $p$', 0, 1, 2 / 3, { step: 0.01 });
        const draw0 = () => { const r = v.rng(seed); const w = S.map(() => Math.pow(-Math.log(1 - r() * 0.999999), 1 / conc.value)); const t = w.reduce((a, b) => a + b, 0); mu = w.map((x) => x / t); };
        const setMode = (m) => { mode = m; P = prep(m === 'pr' ? mkPR() : mkAM()); S = pureStrategies(P, 1); draw0(); [conc, q2, q3].forEach((c) => { c.el.hidden = m !== 'pr'; }); pd.el.hidden = m !== 'am'; };
        v.select('game', [{ value: 'pr', label: 'perfect recall' }, { value: 'am', label: 'absent-minded driver' }], 'pr', { onChange: setMode });
        v.button('new random mixture', () => { seed += 1; draw0(); });
        setMode('pr');
        let info;
        v.render(() => {
          const vw = treeView(P); T.setView(vw.x, vw.y);
          if (mode === 'pr') {
            const others = { X: [q2.value, 1 - q2.value], Y: [q3.value, 1 - q3.value] };
            const beh = kuhnBehaviour(P, 1, S, mu), bAll = { ...others, ...beh };
            const mixOut = mixedOutcome(P, 1, S, mu, others), behOut = P.leaves.map((l) => playBeh(P, bAll).leafP.get(l) || 0);
            drawTree(T, P, { edgeLabel: (e) => (e.from.p === 1 ? `${v.fix(beh[e.from.key][e.i], 2)}` : e.a), nodeTag: (n) => (n.p ? `${n.p}·${n.key}` : null), size: 12 });
            B.setView([0.4, P.nl + 0.6], [0, Math.max(0.3, ...mixOut) * 1.2]);
            P.leaves.forEach((l, j) => {
              B.rect(j + 1 - 0.38, 0, j + 1 - 0.02, mixOut[j], { fill: 'blue', fillAlpha: 0.35, color: 'blue', width: 1.2 });
              B.rect(j + 1 + 0.02, 0, j + 1 + 0.38, behOut[j], { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.2 });
            });
            B.setTicks(P.leaves.map((l, j) => [j + 1, `${l.u[0]}`]), null); B.setLabels('leaf (payoff to player 1)', 'probability');
            info = { diff: Math.max(...mixOut.map((x, j) => Math.abs(x - behOut[j]))), support: mu.filter((x) => x > 0.01).length, u: playBeh(P, bAll).u[0] };
          } else {
            const p = pd.value, beh = { D: [1 - p, p] }, r = playBeh(P, beh);
            drawTree(T, P, { edgeLabel: (e) => `${e.a} ${v.fix(beh.D[e.a === 'exit' ? 0 : 1], 2)}`, nodeTag: (n) => (n.p ? 'driver · D' : null), size: 12 });
            B.setView([0, 1], [0, 1.6]); B.setTicks(null, null); B.setLabels('probability $p$ of continuing', 'expected payoff');
            B.fn((x) => 4 * x * (1 - x) + x * x, { color: 'green', width: 3 });
            B.line(0, 0, 1, 1, { color: 'blue', width: 3 });
            B.text('behaviour strategies', 0.12, 1.45, { color: 'green', weight: 700, size: 12, align: 'left' });
            B.text('mixtures of the two pure strategies', 0.97, 0.3, { color: 'blue', weight: 700, size: 12, align: 'right' });
            B.dot(p, r.u[0], { r: 7, color: 'gold' }); B.dot(2 / 3, 4 / 3, { r: 4, color: 'green' });
            info = { u: r.u[0], p };
          }
        });
        v.readout(() => (mode === 'pr'
          ? `mixture over ${S.length} pure strategies (${info.support} with weight above 1%); largest difference between the two leaf distributions: ${info.diff.toExponential(1)}\nexpected payoff to player 1: ${v.fix(info.u, 3)} — the same under both descriptions`
          : `behaviour payoff at $p=${v.fix(info.p, 2)}$: ${v.fix(info.u, 3)}; best behaviour strategy $p=2/3$ gives $4/3$, best mixture of pure strategies gives only $1$ — the mixture cannot imitate the behaviour strategy`));
      },
    },
  ],
};
