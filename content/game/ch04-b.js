// Game Theory & Social Choice — Chapter 4 (part b): centipede, ultimatum, chain store, imperfect information, Kuhn's theorem
import {
  idx, leaf, dec, isLeaf, prep, playBeh, infoSets, pureStrategies, stratName, drawTree, treeView, nmz, kuhnBehaviour, mixedOutcome,
} from './ch04.shared.js';
import { informationNumber, informationProfile, informationRecallModel, informationForgetModel, informationPlanText, drawInformationTree, drawInformationProbabilities } from './information-audit.js';
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
      num: '4.9', kind: 'Definition',
      name: 'Information sets and behaviour strategies',
      statement: String.raw`A **finite extensive game** is a finite rooted tree with a nonempty finite action set at each decision, terminal payoffs, and fixed probability distributions at chance nodes (zero probabilities are allowed). Each player's decision nodes are partitioned into **information sets**; nodes in a set have the same available actions, and the player's action cannot depend on which of those nodes occurred. Here no information set contains a node and its descendant. A **pure strategy** specifies an action at every information set, including unreached ones. A **mixed strategy** is a distribution over these complete plans. A **behaviour strategy** gives one action distribution at each information set, with independent draws at its different sets. Different players randomize independently. Multiplying the chance and behaviour probabilities on each path gives every terminal history's probability and hence expected payoffs. **Perfect recall** means that at any two nodes of one of a player's information sets, her ordered sequence of earlier information sets and own actions is identical.`,
      idea: String.raw`The complete plans of game-4.1 now choose at information sets, not separately at indistinguishable nodes. Conditional randomization therefore obeys information constraints: in Matching Pennies, player 2 cannot see player 1's action; in the authored poker game, player 2 cannot see the card. Finite expectation and independent randomization between players come from game-2.1; coordinates of a single mixed plan need not be independent. At the poker preset, high always bets, low bets with probability $1/3$, and player 2 calls with probability $2/3$. High strictly prefers betting: $1+2/3>1$. Low is indifferent: $1-3(2/3)=-1$. Conditional on a bet, high has probability $3/4$, so call and fold both give player 2 payoff $-1$. These whole-plan best replies establish Nash equilibrium by game-1.3; linearity rules out a profitable mixed deviation.`,
      caption: String.raw`Choose either authored game and vary every local action probability continuously. Dashed connectors mark shared information sets; $z_j$ identifies a distinct terminal history even when payoffs coincide. The readout retains every probability, complete pure deviation, and its payoff. “Equilibrium preset” sets an analytically justified profile; the numerical regret is a separate floating-point check.`,
      credit: 'Definitions: Osborne & Rubinstein (1994); Bonanno (2024). Authored finite examples.',
      scope: 'Finite trees and independently randomized behaviour profiles; the displayed examples have perfect recall. These are teaching games, not empirical poker models.',
      deps: ['game-4.1', 'game-2.1', 'game-1.3'],
      refs: ['Osborne & Rubinstein (1994), Definitions 200.1, 203.1, 203.3, 212.1', 'Bonanno (2024), Definitions 4.1.1–4.1.2 and 7.1.1'],
      tags: ['information set', 'behaviour strategy'], verify: false,
      viz(v) {
        const T=v.stage({axes:false,height:380,title:'Every information set and terminal history'});
        const B=v.stage({axes:false,height:260,title:'Terminal probabilities (blue)'});
        const key=v.select('authored game',[{value:'pennies',label:'Matching Pennies'},{value:'poker',label:'two-type poker'}],'pennies');
        const controls=['A','B','C'].map(I=>v.slider(`first action at information set ${I}`,0,1,.5,{step:'any',decimals:6,fmt:informationNumber}));
        v.button('equilibrium preset',()=>{[key.value==='pennies'?.5:1,key.value==='pennies'?.5:1/3,key.value==='pennies'?.5:2/3].forEach((x,i)=>controls[i].set(x));});
        let model;
        v.render(()=>{model=informationProfile(key.value,...controls.map(c=>c.value));controls[2].el.hidden=key.value==='pennies';drawInformationTree(T,model.P,model.outcome.reach);drawInformationProbabilities(B,[{color:'blue',values:model.outcome.probabilities}]);});
        v.readout(()=>{const m=model,f=informationNumber;return [
          `Information constraints: ${m.P.information.map(I=>`${I.player}·${I.key}: {${I.actions.join(',')}} at ${I.nodes.length} node(s), first-action probability ${f(m.behavior[I.key][I.actions[0]])}`).join('; ')}`,
          ...m.P.leaves.map((id,j)=>`z${j+1}: ${m.P.nodes[id].history.join(' → ')}; probability ${f(m.outcome.probabilities[j])}; payoff (${m.P.nodes[id].payoff.join(', ')})`),
          `Expected payoff (${m.outcome.payoff.map(f).join(', ')}). Every complete pure deviation:`,
          ...m.deviations.map((ds,i)=>`Player ${i+1}: ${ds.map(d=>`${informationPlanText(d.plan)} ⇒ ${f(d.payoff)}`).join('; ')}. Regret ${m.regrets[i].toExponential(2)} (numerical tolerance 1e-12).`),
          `Perfect-recall own-history audit: both players ${m.recall.every(r=>r.ok)?'pass':'fail'}. Complete plans include off-path choices.`,
        ].join('\n');});
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10', kind: 'Theorem',
      name: 'Kuhn: realization equivalence with perfect recall',
      statement: String.raw`In a finite extensive game, fix a player with **perfect recall** as defined in game-4.9. Every mixed strategy of this player has a **realization-equivalent behaviour strategy**: against every fixed profile of the other players (and the given chance probabilities), the two assign the same probability to **each terminal history**. Conversely a behaviour strategy can be realized by a mixed strategy. This is equality of induced distributions, not identity of strategies; different distributions over complete plans can have the same realization. Behaviour at an information set with zero own-prefix probability can be chosen arbitrarily. Without perfect recall, mixed-to-behaviour equivalence can fail even if no information set is visited twice.`,
      idea: String.raw`Write $\rho_i(h)$ for the mass of pure plans consistent with player $i$'s own earlier actions on the path to $h$. Perfect recall makes that own-history record identical throughout an information set $I$. If $\rho_i(h)>0$, set $\beta_I(a)=\rho_i(ha)/\rho_i(h)$; if it is zero, choose any distribution. Along a terminal history with positive own mass these conditional factors telescope from $1$ to $\rho_i(z)$. If the own mass is zero, its first transition from positive to zero has behaviour probability zero, so all later arbitrary choices are irrelevant. A zero chance factor or an opponent's incompatible plan also makes that terminal probability zero under both descriptions. Thus every terminal history agrees for each opposing pure profile, and finite expectation (game-4.9, via game-2.1) extends this to opposing mixtures and behaviour strategies. This uses conditional probabilities, not independence of the given mixed plan's coordinates. Conversely, independently pre-sample one action at every information set, assigning a complete plan $s$ mass $\prod_I\beta_I(s(I))$. Perfect recall prevents repeated information sets on a path; summing over unused coordinates contributes factors of $1$, giving the behaviour probability at every terminal history. The empty plan has mass $1$ when the player never moves.`,
      caption: String.raw`The authored perfect-recall tree exposes all four pure-plan weights. The three allocation controls cover the full probability simplex; compare every terminal probability (blue: original mixture, green: behaviour). Presets include distinct equivalent mixtures, a zero own-prefix, and a positive prefix of $10^{-14}$: positive mass is never replaced by a numerical zero cutoff. In “forgets own action”, the two nodes of $B$ have different own histories. The target mixture has determinant $\lambda(1-\lambda)$; every behaviour distribution has determinant zero. This proves impossibility for $0<\lambda<1$, while the endpoints admit equivalence.`,
      credit: 'Kuhn’s theorem, as proved in Osborne & Rubinstein (1994), Proposition 214.1; exposition also Bonanno (2024).',
      scope: 'Finite games; equivalence is against every opponent profile at every terminal history. Authored examples and floating-point residuals illustrate the exact argument. The original 1953 chapter has not been audited here.',
      deps: ['game-4.9'],
      refs: ['Osborne & Rubinstein (1994), Proposition 214.1, proof p.215 and Figure 215.1', 'Bonanno (2024), §7.1, Theorem 7.1.1 and Figure 7.4'],
      tags: ['perfect recall', 'behaviour strategy'], verify: false,
      viz(v) {
        const T=v.stage({axes:false,height:380,title:'Information sets and complete terminal histories'});
        const B=v.stage({axes:false,height:260,title:'Terminal probabilities: mixture blue, behaviour green'});
        const mode=v.select('authored game',[{value:'recall',label:'perfect recall'},{value:'forget',label:'forgets own action'}],'recall');
        const labels=['first pure-plan weight u','share v of remainder for second plan','share w of next remainder for third plan','opponent probability q of l','zero-prefix fallback: first action probability','target diagonal weight λ','behaviour probability p of L','behaviour probability r of a'];
        const defaults=[.25,1/3,.5,.5,.5,.5,.5,.5];
        const controls=labels.map((s,i)=>v.slider(s,0,1,defaults[i],{step:'any',decimals:6,fmt:informationNumber}));
        for(const [label,values] of [['uniform mixture',[.25,1/3,.5]],['correlated mixture',[.5,0,0]],['equivalent mixture A',[.25,1/3,1]],['equivalent mixture B',[.25,1/3,0]],['zero own-prefix',[0,0,.5]],['rare positive prefix',[1e-14,0,0]]])v.button(label,()=>{mode.set('recall');values.forEach((x,i)=>controls[i].set(x));});
        let model;
        v.render(()=>{const pr=mode.value==='recall';controls.forEach((c,i)=>{c.el.hidden=pr?i>=5:i<5;});model=pr?informationRecallModel(...controls.slice(0,5).map(c=>c.value)):informationForgetModel(...controls.slice(5).map(c=>c.value));drawInformationTree(T,model.P,(pr?model.original:model.mixed).reach);drawInformationProbabilities(B,[{color:'blue',values:(pr?model.original:model.mixed).probabilities},{color:'green',values:model.realized.probabilities}]);});
        v.readout(()=>{const m=model,pr=mode.value==='recall',f=informationNumber,original=pr?m.original:m.mixed;return [
          `All complete player-1 plans: ${m.plans.map((s,j)=>`${informationPlanText(s)}: ${f(m.mu[j])}`).join('; ')}.`,
          ...(pr?[`Allocation: μ=(u, (1−u)v, (1−u)(1−v)w, (1−u)(1−v)(1−w)).`,...m.converted.records.map(r=>`${r.info}: own prefix ${r.prefix.map(([I,a])=>`${I}=${a}`).join(', ')||'(empty)'}; mass ${f(r.denominator)}, action masses (${r.numerators.map(f).join(', ')}); behaviour (${r.probabilities.map(f).join(', ')})${r.arbitrary?' — arbitrary at EXACT zero':' — conditional ratios'}.`),`Product pre-sampling gives another equivalent mixture (${m.product.map(f).join(', ')}). Opponent: X=l with probability ${f(controls[3].value)}.`]:[`Perfect recall FAILS at B: own histories A=L and A=R differ. Target determinant λ(1−λ)=${f(m.determinant)}; behaviour determinant residual ${m.behaviorDeterminant.toExponential(2)}.`,m.determinant>0?'Positive target determinant proves no behaviour strategy matches all four terminal histories.':'Degenerate target: equivalence is possible by setting p=r=λ.']),
          ...m.P.leaves.map((id,j)=>`z${j+1}: ${m.P.nodes[id].history.join(' → ')}; mixture ${f(original.probabilities[j])}, behaviour ${f(m.realized.probabilities[j])}.`),
          `Largest displayed terminal-probability difference ${m.difference.toExponential(2)}${pr?' (floating-point check; exact proof above).':' for the selected behaviour, not an optimized distance.'}`,
        ].join('\n');});
      },
    },
  ],
};
