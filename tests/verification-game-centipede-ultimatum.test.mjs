import test from 'node:test';import assert from 'node:assert/strict';
import{centipedePayoff as pay,centipedePlan as plan,centipedeOutcome as out,centipedeModel as model,ultimatumModel as ultimatum}from'../content/game/source-audit-centipede-ultimatum.js';
const range=n=>Array.from({length:n},(_,i)=>i),mover=m=>(m-1)%2;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
const ownPlans=(n,who)=>{const nodes=range(n).filter(j=>j%2===who);return range(2**nodes.length).map(mask=>range(n).map(j=>j%2===who?!!(mask&(1<<nodes.indexOf(j))):false));};
function play(n,S,start=1){for(let k=start;k<=n;k++)if(S[mover(k)][k-1])return k;return n+1;}
function money(m){const a=2**(m+1),b=2**(m-1);return m%2?[a,b]:[b,a];}
test('Every offered level plan is a global best response in every subgame against the stated preceding-level opponent, by independent complete-plan enumeration',()=>{
 for(let n=2;n<=10;n++)for(let who=0;who<2;who++)for(let k=0;k<=10;k++){
  const S=plan(n,who,k);assert.equal(S.length,n);assert.ok(S.every(x=>typeof x==='boolean'));
  if(!k){assert.ok(S.every(x=>!x));continue;}
  const opponent=plan(n,1-who,k-1),P=who?[opponent,S]:[S,opponent];
  for(let start=1;start<=n+1;start++){
   const possibilities=ownPlans(n,who).map(s=>money(play(n,who?[opponent,s]:[s,opponent],start))[who]);
   assert.equal(money(play(n,P,start))[who],Math.max(...possibilities));
   if(start<=n&&mover(start)===who){const take=money(start)[who],pass=money(play(n,P,start+1))[who];assert.equal(S[start-1],take>pass);}
  }
 }
});
test('All1024 maximal complete profiles and every shorter game: global subgame deviations equal single-node tests, unique SPE is take everywhere; every level-grid cell and terminal record is retained',()=>{
 for(let n=2;n<=10;n++){
  let spe=0;const A=ownPlans(n,0),B=ownPlans(n,1);
  for(const a of A)for(const b of B){const S=[a,b];let local=true,global=true;
   for(let start=1;start<=n;start++){
    const who=mover(start),current=money(play(n,S,start))[who],T=S.map(x=>x.slice());T[who][start-1]=!T[who][start-1];if(money(play(n,T,start))[who]>current)local=false;
    for(const who2 of[0,1])for(const s of(who2?B:A)){const other=S[1-who2],T=who2?[other,s]:[s,other];if(money(play(n,T,start))[who2]>money(play(n,S,start))[who2])global=false;}
   }
   assert.equal(local,global);if(global){spe++;for(let m=1;m<=n;m++)assert.equal(S[mover(m)][m-1],true);}
  }
  assert.equal(spe,1);assert.deepEqual(pay(n+1),money(n+1));assert.ok(pay(n+1).every((x,i)=>x>money(1)[i]));
  for(let a=0;a<=10;a++)for(let b=0;b<=10;b++){
   const p=model(n,a,b,n+1);assert.equal(p.a,a);assert.equal(p.b,b);assert.equal(p.inspect,n+1);assert.equal(p.grid.length,11);assert.equal(p.stop,play(n,p.plans));assert.deepEqual(p.pay,money(p.stop));assert.equal(p.grid[a][b],p.stop);
   assert.deepEqual(p.violations,p.continuations.filter(q=>q.gain>0).map(q=>q.m));assert.equal(p.strategyCounts[0]*p.strategyCounts[1],2**n);
   for(const q of p.continuations){assert.deepEqual(q.take,money(q.m));assert.equal(q.passStop,play(n,p.plans,q.m+1));assert.deepEqual(q.pass,money(q.passStop));}
  }
 }
 assert.equal(model(10,9,0).stop,3);assert.equal(model(2,10,10).a,10);assert.equal(model(10,0,0).stop,11);
});
test('Money-only ultimatum has exactly two pure subgame-perfect profiles under independent enumeration of all22528 offer/response profiles; all17 inequity ticks check full utility best replies',()=>{
 const equilibria=[];for(let mask=0;mask<2048;mask++)for(let offer=0;offer<=10;offer++){
  const accepts=x=>!!(mask&(1<<x));let spe=true;
  for(let x=1;x<=10;x++)if(!accepts(x))spe=false;
  const current=accepts(offer)?10-offer:0;if(range(11).some(x=>(accepts(x)?10-x:0)>current))spe=false;
  if(spe)equilibria.push([offer,accepts(0)]);
 }
 assert.deepEqual(equilibria,[[1,false],[0,true]]);
 for(const zero of['accept','reject']){const p=ultimatum('money',0,0,0,zero);assert.deepEqual(p.bestOffers,[zero==='accept'?0:1]);assert.equal(p.probabilities[0],zero==='accept'?1:0);assert.ok(p.probabilities.slice(1).every(x=>x===1));}
 for(let j=0;j<=16;j++){const alpha=j/4,p=ultimatum('inequity',0,0,alpha);for(let x=0;x<=10;x++){const u=x-alpha*Math.max((10-x)-x,0)-0*Math.max(x-(10-x),0);assert.equal(p.numerators[x],u>=0?1:0);assert.equal(p.utilities[x],u);}
  assert.deepEqual(p.bestOffers,[Math.ceil(10*alpha/(1+2*alpha))]);assert.ok(p.realThreshold<5);
 }
 assert.equal(ultimatum('inequity',0,0,.75).probabilities[3],1);assert.equal(ultimatum('inequity',0,0,2).probabilities[4],1);
});
test('All72 finite threshold populations and12 fixed rules retain every exact profit tie, complete mass/support and independent rational welfare accounting',()=>{
 for(let mu=0;mu<=11;mu++)for(let w=0;w<=5;w++){
  const p=ultimatum('population',mu,w),support=range(12).filter(m=>m>=mu-w&&m<=mu+w);assert.deepEqual(p.support,support);assert.equal(p.denominator,support.length);
  const numerator=range(11).map(x=>support.reduce((s,m)=>s+(x>=m),0)),profits=numerator.map((k,x)=>(10-x)*k);assert.deepEqual(p.numerators,numerator);assert.deepEqual(p.profitNumerators,profits);
  assert.deepEqual(p.bestOffers,range(11).filter(x=>profits[x]===Math.max(...profits)));
  for(let x=0;x<=10;x++){near(p.probabilities[x],numerator[x]/support.length);near(p.profits[x]+p.responderMoney[x],10*p.probabilities[x]);assert.ok(p.probabilities[x]>=0&&p.probabilities[x]<=1);if(x)assert.ok(p.probabilities[x]>=p.probabilities[x-1]);}
 }
 for(let m=0;m<=11;m++){const p=ultimatum('threshold',m);assert.deepEqual(p.numerators,range(11).map(x=>+(x>=m)));assert.deepEqual(p.profits,ultimatum('population',m,0).profits);}
 assert.deepEqual(ultimatum('population',5,5).bestOffers,[4,5]);assert.deepEqual(ultimatum('threshold',10).bestOffers,range(11));assert.deepEqual(ultimatum('threshold',11).bestOffers,range(11));assert.deepEqual(ultimatum('population',11,0).bestOffers,range(11));
});
test('Malformed controls/plans, holes, and unsupported choices fail before arithmetic',()=>{
 for(const args of[[1,0,0],[11,0,0],[2,-1,0],[2,11,0],[2,0,0,4]])assert.throws(()=>model(...args),RangeError);
 for(const S of[Array(2),[Array(2),[false,false]],[[true,false],[false]],[[true,1],[true,false]]])assert.throws(()=>out(2,S),RangeError);
 for(const args of[['wrong'],['money',-.5],['population',0,6],['inequity',0,0,Infinity],['money',0,0,0,'wrong']])assert.throws(()=>ultimatum(...args),RangeError);
});
