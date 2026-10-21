import test from 'node:test';
import assert from 'node:assert/strict';
import { leaf, dec, prep, strategicForm, pureNash } from '../content/game/ch04.shared.js';
import { rng } from '../assets/js/viz/math.js';
import { TREE_EXAMPLES, entryTree, entryEquilibria, solveFiniteTree, checkFiniteProfile, randomFiniteTree, validateFiniteTree, binaryTreeCounts, nodeHistory } from '../content/game/finite-tree-audit.js';

const profiles = nodes => nodes.reduce((out,n)=>out.flatMap(p=>n.kids.map((_,i)=>({...p,[n.id]:i}))),[{}]);
const payoff = (n,p) => { while(n.kids)n=n.kids[p[n.id]].n;return n.u; };
function descendants(n){return[n,...(n.kids||[]).flatMap(k=>descendants(k.n))];}
// Full independent enumeration of unilateral complete plans, not the production best-deviation DP.
function bruteCheck(root,p){const players=descendants(root).find(n=>!n.kids).u.length,bad=[];for(const n of descendants(root).filter(n=>n.kids)){const base=payoff(n,p);for(let j=1;j<=players;j++){const own=descendants(n).filter(a=>a.kids&&a.p===j);if(profiles(own).some(a=>payoff(n,{...p,...a})[j-1]>base[j-1])){bad.push(n.id);break;}}}return{spe:bad.length===0,nash:!bad.includes(root.id),bad};}
function localCriterion(root,p){return descendants(root).filter(n=>n.kids).every(n=>{const v=payoff(n,p)[n.p-1];return n.kids.every(k=>payoff(k.n,p)[n.p-1]<=v);});}

test('all256 binary two-level payoff games: exhaustive complete deviations and one-node criterion agree, both BI tie policies are SPE',()=>{
 for(let bits=0;bits<256;bits++){
  const u=Array.from({length:4},(_,i)=>leaf((bits>>(2*i))&1,(bits>>(2*i+1))&1));
  const P=prep(dec(1,[['L',dec(2,[['l',u[0]],['r',u[1]]])],['R',dec(2,[['l',u[2]],['r',u[3]]])]]));
  for(const p of profiles(P.nodes.filter(n=>n.kids))){const b=bruteCheck(P.root,p),c=checkFiniteProfile(P.root,p);assert.equal(c.spe,b.spe);assert.equal(c.nash,b.nash);assert.deepEqual([...c.badSet].map(n=>n.id).sort(),b.bad.sort());assert.equal(localCriterion(P.root,p),b.spe);}
  for(const t of['first','last']){const s=solveFiniteTree(P.root,t);assert.equal(bruteCheck(P.root,s.profile).spe,true);assert.deepEqual(s.value,payoff(P.root,s.profile));}
 }
});
test('all77 entry-game parameter pairs retain every weak-reply equilibrium, including both exact tie boundaries',()=>{
 for(let f=-2;f<=3;f+=.5)for(let l=-3;l<=0;l+=.5){const q=entryEquilibria(f,l),nash=[],spe=[];for(let i=0;i<2;i++)for(let j=0;j<2;j++){
  const incumbentBest=j===0?f>=1:f<=1,entrantBest=i===0?(j===0?0>=l:false):(j===0?l>=0:true),rootNash=entrantBest&&(i===0||incumbentBest);
  if(rootNash)nash.push([i,j]);if(entrantBest&&incumbentBest)spe.push([i,j]);
 }assert.deepEqual(q.nash,nash);assert.deepEqual(q.spe,spe);}
 assert.deepEqual(entryEquilibria(1,0).spe,[[0,0],[1,0],[1,1]]);assert.deepEqual(entryEquilibria(1,-1).spe,[[0,0],[1,1]]);assert.deepEqual(entryEquilibria(3,0).spe,[[0,0],[1,0]]);
 const P=entryTree(-.5,-1),c=checkFiniteProfile(P.root,{n0:0,n2:0});assert.equal(c.nash,true);assert.equal(c.spe,false);assert.deepEqual([...c.badSet].map(n=>n.id),['n2']);
});
test('every128 complete profiles of16 three-level games: multi-decision unilateral gains match exhaustive whole-plan enumeration',()=>{
 for(let seed=1;seed<=16;seed++){const P=randomFiniteTree(rng(seed*97),3,2,3);for(const p of profiles(P.nodes.filter(n=>n.kids))){const c=checkFiniteProfile(P.root,p),b=bruteCheck(P.root,p);assert.equal(c.nash,b.nash);assert.equal(c.spe,b.spe);assert.deepEqual([...c.badSet].map(n=>n.id).sort(),b.bad.sort());
  for(const n of P.nodes)for(let j=1;j<=2;j++){const own=descendants(n).filter(a=>a.kids&&a.p===j),best=Math.max(...profiles(own).map(a=>payoff(n,{...p,...a})[j-1]));assert.equal(c.best.get(n)[j-1],best);}
 }}
});
test('all authored example strategic-form cells, complete plans, leaf paths and pure Nash sets match independent direct traversal',()=>{
 for(const make of Object.values(TREE_EXAMPLES)){const P=prep(make()),F=strategicForm(P),nash=[];
  const own=p=>profiles(P.nodes.filter(n=>n.kids&&n.p===p));assert.deepEqual(F.S1,own(1));assert.deepEqual(F.S2,own(2));
  F.S1.forEach((a,i)=>F.S2.forEach((b,j)=>{const p={...a,...b};assert.deepEqual(F.U[i][j],payoff(P.root,p));if(bruteCheck(P.root,p).nash)nash.push([i,j]);}));assert.deepEqual(pureNash(F.U),nash);
  for(const n of P.nodes){const expected=[];for(let x=n;x.par;x=x.par)expected.unshift(x.par.kids[x.pa].a);assert.equal(nodeHistory(n),expected.length?expected.join(' → '):'root');}
 }
});
test('every64 offered seeds and all dimension/tie controls preserve exact inventory, postorder readiness and optimal continuation choices',()=>{
 for(let seed=1;seed<=64;seed++)for(const[depth,b,maxPayoff]of[[2,2,9],[2,3,9],[3,2,9],[3,3,9],[4,2,9],[4,3,9],[2,2,5],[3,2,5],[4,2,5],[5,2,5]])for(const tie of['first','last']){
  const P=randomFiniteTree(rng(seed),depth,b,maxPayoff),s=solveFiniteTree(P.root,tie),seen=new Set(P.leaves);assert.equal(P.leaves.length,b**depth);assert.equal(P.nodes.length,(b**(depth+1)-1)/(b-1));assert.equal(s.order.length,(b**depth-1)/(b-1));
  for(const n of s.order){assert.ok(n.kids.every(k=>seen.has(k.n)));const numbers=n.kids.map(k=>payoff(k.n,s.profile)[n.p-1]),best=Math.max(...numbers),ties=numbers.flatMap((v,i)=>v===best?[i]:[]);assert.deepEqual(s.ties.get(n),ties);assert.equal(s.profile[n.id],ties[tie==='first'?0:ties.length-1]);assert.deepEqual(s.values.get(n),payoff(n,s.profile));seen.add(n);}
  assert.equal(localCriterion(P.root,s.profile),true);assert.equal(checkFiniteProfile(P.root,s.profile).spe,true);
 }
});
test('terminal-only, one-action and three-player trees; strict payoffs give unique pure SPE while tied payoffs may change ancestor values',()=>{
 const single=prep(leaf(2,-1));assert.deepEqual(solveFiniteTree(single.root).profile,{});assert.equal(checkFiniteProfile(single.root,{}).spe,true);
 const one=prep(dec(1,[['only',leaf(2,-1)]]));assert.deepEqual(solveFiniteTree(one.root).value,[2,-1]);
 const solitary=prep({p:1,kids:[{a:'a',n:{u:[1]}},{a:'b',n:{u:[2]}}]});const solo=solveFiniteTree(solitary.root);assert.deepEqual(solo.value,[2]);assert.equal(checkFiniteProfile(solitary.root,solo.profile).spe,true);
 const P=prep({p:3,kids:[{a:'a',n:{u:[1,7,2]}},{a:'b',n:{u:[3,6,5]}}]});assert.deepEqual(solveFiniteTree(P.root).value,[3,6,5]);
 const strict=prep(dec(1,[['L',dec(2,[['a',leaf(1,4)],['b',leaf(2,3)]])],['R',dec(2,[['a',leaf(3,2)],['b',leaf(4,1)]])]]));assert.equal(profiles(strict.nodes.filter(n=>n.kids)).filter(p=>bruteCheck(strict.root,p).spe).length,1);
 const tied=prep(dec(1,[['Out',leaf(1,0)],['In',dec(2,[['a',leaf(0,1)],['b',leaf(2,1)]])]]));const first=solveFiniteTree(tied.root,'first'),last=solveFiniteTree(tied.root,'last');assert.deepEqual(first.value,[1,0]);assert.deepEqual(last.value,[2,1]);assert.equal(bruteCheck(tied.root,first.profile).spe,true);assert.equal(bruteCheck(tied.root,last.profile).spe,true);
 const offPath=prep(dec(1,[['Out',leaf(2,0)],['In',dec(2,[['a',leaf(0,1)],['b',leaf(1,1)]])]]));const equilibria=profiles(offPath.nodes.filter(n=>n.kids)).filter(p=>bruteCheck(offPath.root,p).spe);assert.equal(equilibria.length,2);equilibria.forEach(p=>assert.equal(offPath.root.kids[p[offPath.root.id]].a,'Out'));
});
test('profile growth counts are exact, and malformed/chance/information-set/nonfinite tree models are refused',()=>{
 for(let d=1;d<=5;d++){const c=binaryTreeCounts(d);assert.equal(c.decisions,2**d-1);assert.equal(c.profilesLog10,(2**d-1)*Math.log10(2));assert.equal(c.nodesLog10,Math.log10(2**d-1));}
 const label=root=>{const seen=new Set();(function go(n){if(seen.has(n))return;seen.add(n);n.id=`n${seen.size}`;n.kids?.forEach(k=>go(k.n));})(root);return root;};
 for(const root of[{p:1,kids:[]},{p:0,kids:[{a:'x',n:{u:[1,2]}}]},{p:3,kids:[{a:'x',n:{u:[1,2]}}]},{u:[NaN,1]},{p:1,kids:[{a:'x',n:{u:[1]}},{a:'y',n:{u:[1,2]}}]},{p:1,kids:[{a:'x',n:{u:[1]}},{a:'x',n:{u:[2]}}]}])assert.throws(()=>validateFiniteTree(label(root)));
 const same=leaf(1,2);assert.throws(()=>validateFiniteTree(label(dec(1,[['a',same],['b',same]]))));const cyclic={p:1,kids:[]};cyclic.kids.push({a:'x',n:cyclic});assert.throws(()=>validateFiniteTree(label(cyclic)));
 const imperfect=dec(1,[['a',dec(2,[['x',leaf(1,2)]],'I')],['b',dec(2,[['x',leaf(2,1)]],'I')]]);assert.throws(()=>validateFiniteTree(label(imperfect)));assert.throws(()=>validateFiniteTree(dec(1,[['x',leaf(1,2)]])),/prepared tree/);
 const P=entryTree(1,0);assert.throws(()=>checkFiniteProfile(P.root,{}));assert.throws(()=>solveFiniteTree(P.root,'unknown'));
});
