import test from 'node:test';import assert from 'node:assert/strict';
import {scheduleStats,swapFirstInversion,exchangeCounterexample} from '../content/algo/greedy-audit.shared.js';
import {sysGraphic,sysLinear,sysUniform,sysMatching,greedyIndep,bestIndep,matroidTest} from '../content/algo/ch10.shared.js';
const permutations=a=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>j!==i)).map(p=>[x,...p])):[[]];
function subsetOpt(jobs){
 const N=1<<jobs.length,dp=Array(N).fill(Infinity),time=Array(N).fill(0);dp[0]=-Infinity;
 for(let m=1;m<N;m++){for(let j=0;j<jobs.length;j++)if(m>>j&1)time[m]+=jobs[j].t;for(let j=0;j<jobs.length;j++)if(m>>j&1)dp[m]=Math.min(dp[m],Math.max(dp[m^(1<<j)],time[m]-jobs[j].d));}return dp.at(-1);
}
const edf=jobs=>jobs.map((_,i)=>i).sort((a,b)=>jobs[a].d-jobs[b].d||a-b),pop=m=>m.toString(2).replaceAll('0','').length;
test('EDF signed lateness matches an independent subset DP in all3375 small scheduling worlds',()=>{
 const options=[1,2,3].flatMap(t=>[-2,0,2,4,6].map(d=>({t,d})));
 for(const a of options)for(const b of options)for(const c of options){const J=[a,b,c],opt=subsetOpt(J),r=scheduleStats(J,edf(J));assert.equal(r.L,opt);assert.equal(Math.max(0,r.L),Math.min(...permutations([0,1,2]).map(p=>Math.max(0,scheduleStats(J,p).L))));}
 const J=Array.from({length:5},()=>({t:1,d:16}));assert.equal(scheduleStats(J,edf(J)).L,-11);
});
test('every five-job duration/deadline corner agrees with all120 orders and independent optimal DP',()=>{
 const P=permutations([0,1,2,3,4]);for(let mask=0;mask<1024;mask++){
  const J=Array.from({length:5},(_,i)=>({t:mask>>(2*i)&1?6:1,d:mask>>(2*i+1)&1?16:1})),want=subsetOpt(J),scores=P.map(p=>scheduleStats(J,p).L);
  assert.equal(Math.min(...scores),want);assert.equal(scheduleStats(J,edf(J)).L,want);
 }
});
test('each adjacent inversion swap preserves other completion times, lowers inversion count by1 and never worsens lateness',()=>{
 const worlds=[[[3,5],[2,7],[1,8],[4,9],[3,13]],[[1,16],[1,16],[1,16],[1,16],[1,16]],[[6,1],[1,1],[2,16],[5,4],[3,7]],[[2,-4],[4,0],[1,-2],[3,8],[6,1]]].map(a=>a.map(([t,d])=>({t,d})));
 for(const J of worlds)for(const p of permutations([0,1,2,3,4])){
  let order=p,count=0;
  for(;;){const r=swapFirstInversion(J,order);if(r.none)break;assert.ok(r.after<=r.before);assert.equal(r.inversionsAfter,r.inversionsBefore-1);const a=scheduleStats(J,order),b=scheduleStats(J,r.order);for(const row of a.rows)if(row.id!==order[r.k]&&row.id!==order[r.k+1])assert.equal(b.rows.find(x=>x.id===row.id).c,row.c);order=r.order;count++;assert.ok(count<=10);}
  assert.equal(scheduleStats(J,order).L,subsetOpt(J));
 }
});
test('all167 nonempty hereditary families on4 elements: exhaustive axioms, all625 weights for68 matroids, explicit failed-exchange certificates otherwise',()=>{
 let families=0,matroids=0;
 for(let family=1;family<65536;family+=2){
  const members=Array.from({length:16},(_,m)=>m).filter(m=>family>>m&1),has=m=>Boolean(family>>m&1);
  if(!members.every(m=>Array.from({length:16},(_,a)=>a).every(a=>(a&m)!==a||has(a))))continue;families++;
  const exchange=members.every(a=>members.every(b=>pop(a)>=pop(b)||Array.from({length:4},(_,i)=>i).some(i=>(b>>i&1)&&!(a>>i&1)&&has(a|1<<i)))),sys={n:4,indep:has};assert.equal(matroidTest(sys).exchange,exchange);
  if(exchange){matroids++;assert.equal(exchangeCounterexample(sys),null);for(let code=0;code<625;code++){let n=code;const weights=Array.from({length:4},()=>{const x=n%5;n=Math.floor(n/5);return x;}),independentBest=Math.max(...members.map(m=>weights.reduce((s,w,i)=>s+((m>>i&1)?w:0),0)));assert.equal(greedyIndep(sys,weights).weight,independentBest);}}
  else{const c=exchangeCounterexample(sys),a=pop(c.A);assert.ok(c.margin>=1);assert.equal(c.greedy.weight,a*(a+2));assert.ok(members.includes(c.B));assert.ok(c.weights.reduce((s,w,i)=>s+((c.B>>i&1)?w:0),0)>c.greedy.weight);}
 }
 assert.equal(families,167);assert.equal(matroids,68);
});
test('displayed integer graph/vector oracles include loops, parallels, forests and genuine nonmatroid matchings',()=>{
 const graph=sysGraphic([[0,1],[1,2],[2,3],[3,0],[0,2],[1,3]]),linear=sysLinear([[3,0],[2,2],[-1,2],[-2,0],[0,-2]]),uniform=sysUniform(2,5),matching=sysMatching([[0,1],[1,2],[2,3],[3,4],[4,0]]);
 for(const[sys,count,exchange]of [[graph,38,true],[linear,15,true],[uniform,16,true],[matching,11,false]]){const r=matroidTest(sys);assert.equal(r.count,count);assert.equal(r.exchange,exchange);if(exchange)assert.equal(exchangeCounterexample(sys),null);else assert.ok(exchangeCounterexample(sys).margin>0);}
 for(const vectors of [[[0,0],[0,0],[0,0],[0,0],[0,0]],[[1,1],[2,2],[-3,-3],[0,0],[4,4]],[[4,3],[-4,3],[-4,-3],[4,-3],[0,0]]]){
  const sys=sysLinear(vectors);assert.equal(matroidTest(sys).exchange,true);
  for(let m=0;m<32;m++){const v=vectors.filter((_,i)=>m>>i&1);const want=v.length<=2&&v.every(([x,y])=>x!==0||y!==0)&&(v.length<2||v[0][0]*v[1][1]!==v[0][1]*v[1][0]);assert.equal(sys.indep(m),want);}
 }
});
test('negative weights distinguish a maximum-weight basis from a maximum-weight independent set',()=>{
 const sys=sysUniform(1,2),w=[-2,-1];assert.equal(greedyIndep(sys,w).weight,-1);assert.equal(bestIndep(sys,w).weight,0);
 const basisWeights=[1,2].map(m=>w[m===1?0:1]);assert.equal(Math.max(...basisWeights),-1);
 const c=exchangeCounterexample(sysMatching([[0,1],[1,2],[2,3],[3,4],[4,0]]));assert.deepEqual(c.weights.map(w=>Number.isInteger(w)&&w>=0&&w<=10),[true,true,true,true,true]);
});
