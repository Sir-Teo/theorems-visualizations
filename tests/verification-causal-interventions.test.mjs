import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {backDoorCheck,swigCovariate,mBias,SIMPSON_TABLES,reweightedTable,supportedFrontDoor,lordPopulation,lordWeight} from '../content/causal/intervention-audit.shared.js';
import {binModel,jointP,probOf,condProb,coefMatrix,semCov,popReg,totalEffect,dSep,descendants,sampleTable} from '../content/causal/ch04.shared.js';
const near=(a,b,t=3e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// Independent structural expansion: finite DAG path sums, not matrix inversion.
function covariance(n,E,weight){
  const paths=Array.from({length:n},(_,i)=>{const a=Array(n).fill(0);a[i]=1;return a;});
  for(let start=0;start<n;start++){
    const walk=(u,w,seen)=>{for(const[a,b]of E)if(a===u&&!seen.has(b)){const q=w*weight(a,b);paths[b][start]+=q;walk(b,q,new Set([...seen,b]));}};
    walk(start,1,new Set([start]));
  }
  return paths.map(a=>paths.map(b=>a.reduce((s,x,k)=>s+x*b[k],0)));
}
function solve(A,b){A=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<b.length;k++){let p=k;for(let j=k+1;j<b.length;j++)if(Math.abs(A[j][k])>Math.abs(A[p][k]))p=j;[A[k],A[p]]=[A[p],A[k]];const a=A[k][k];for(let j=k;j<=b.length;j++)A[k][j]/=a;for(let i=0;i<b.length;i++)if(i!==k){const z=A[i][k];for(let j=k;j<=b.length;j++)A[i][j]-=z*A[k][j];}}return A.map(r=>r.at(-1));}
const reg=(S,y,xs)=>solve(xs.map(i=>xs.map(j=>S[i][j])),xs.map(i=>S[i][y]));
function enumerate(m,forced={}){
  const order=[],left=new Set(Array.from({length:m.n},(_,i)=>i));while(left.size){const i=[...left].find(i=>m.pa[i].every(p=>order.includes(p)));assert.notEqual(i,undefined);order.push(i);left.delete(i);}
  const out=Array(2**m.n).fill(0),walk=(k,bits,p)=>{if(k===order.length){out[bits.reduce((s,b,i)=>s+b*2**i,0)]+=p;return;}const i=order[k];if(forced[i]!==undefined){bits[i]=forced[i];walk(k+1,bits,p);return;}const z=m.bias[i]+m.pa[i].reduce((s,a,j)=>s+m.wt[i][j]*(2*bits[a]-1),0),q=1/(1+Math.exp(-z));for(const b of [0,1]){bits[i]=b;walk(k+1,bits,p*(b?q:1-q));}};walk(0,Array(m.n).fill(0),1);return out;
}
test('intervention enumeration preserves untouched mechanisms and normalization across all slider corners',()=>{
  for(const c of [-2.5,0,2.5])for(const d of [-2.5,0,2.5])for(const e of [-2,0,2]){
    const m=binModel(3,[[0,1],[0,2],[1,2]],{seed:5,W:{'0>1':c,'0>2':d,'1>2':e}}),P=jointP(m);
    for(const f of [{},{1:0},{1:1}]){const a=jointP(m,f),b=enumerate(m,f);near(a.reduce((s,x)=>s+x,0),1);a.forEach((x,i)=>near(x,b[i]));}
    for(const x of [0,1])if(c===0||d===0)near(condProb(P,3,2,{1:x}),probOf(jointP(m,{1:x}),3,{2:1}));
  }
});
test('back-door classification matches independent open-simple-path logic on every four-node ordered DAG and disjoint covariate set',()=>{
  function sep(n,E,x,y,Z){const pa=Array.from({length:n},()=>[]),adj=Array.from({length:n},()=>[]);for(const[a,b]of E){pa[b].push(a);adj[a].push(b);adj[b].push(a);}const az=new Set(Z),stack=[...Z];while(stack.length)for(const p of pa[stack.pop()])if(!az.has(p)){az.add(p);stack.push(p);}let open=false;function walk(P){const u=P.at(-1);if(u===y){for(let i=1;i<P.length-1;i++){const[a,b,c]=P.slice(i-1,i+2),coll=pa[b].includes(a)&&pa[b].includes(c);if(coll?!az.has(b):Z.has(b))return;}open=true;return;}for(const v of adj[u])if(!P.includes(v))walk([...P,v]);}walk([x]);return !open;}
  const possible=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
  for(let mask=0;mask<64;mask++){const E=possible.filter((_,k)=>mask>>k&1);for(let x=0;x<4;x++)for(let y=0;y<4;y++)if(x!==y){const cov=[0,1,2,3].filter(i=>i!==x&&i!==y);for(let z=0;z<4;z++){const Z=new Set(cov.filter((_,k)=>z>>k&1)),reach=new Set([x]);for(let k=0;k<4;k++)for(const[a,b]of E)if(reach.has(a))reach.add(b);const expected=[...Z].every(i=>!reach.has(i))&&sep(4,E.filter(([a])=>a!==x),x,y,Z);assert.equal(backDoorCheck(4,E,x,y,Z).ok,expected);}}}
});
test('population adjustment equals directed path total effects for all valid subsets and permits accidental equality for invalid sets',()=>{
  const E=[[2,0],[2,1],[3,0],[3,4],[4,1],[0,1],[0,5],[5,1]];
  for(const theta of [-1,0,1,2])for(let mask=0;mask<16;mask++){
    const f=(a,b)=>a===0&&b===1?theta:.45+.15*((a+2*b)%3),B=coefMatrix(6,E,f),S=covariance(6,E,f),Z=[2,3,4,5].filter((_,k)=>mask>>k&1),p=reg(S,1,[0,...Z])[0];
    S.forEach((r,i)=>r.forEach((x,j)=>near(x,semCov(6,B,Array(6).fill(1))[i][j])));near(popReg(S,1,[0,...Z])[0],p);if(backDoorCheck(6,E,0,1,Z).ok)near(p,totalEffect(6,B,1,0));
  }
  const E2=[[2,0],[2,1],[0,1]],B=coefMatrix(3,E2,(a,b)=>a===2?0:1),S=covariance(3,E2,(a,b)=>a===2?0:1);assert.equal(backDoorCheck(3,E2,0,1,[]).ok,false);near(popReg(S,1,[0])[0],totalEffect(3,B,1,0));
});
test('original clinical table and official R six-department counts preserve totals, four-of-six qualification and early crossing',()=>{
  const K=SIMPSON_TABLES.kidney,U=SIMPSON_TABLES.ucb;
  const raw=JSON.parse(fs.readFileSync(new URL('../docs/verification/causal-interventions-data.json',import.meta.url))).ucb.rArray;
  for(let k=0;k<6;k++)for(let g=0;g<2;g++){const j=4*k+2*(1-g);assert.equal(U.s[g][k],raw[j]);assert.equal(U.n[g][k],raw[j]+raw[j+1]);}
  assert.deepEqual(K.n,[[13+31+43,218+45],[270,80]]);assert.deepEqual(K.s,[[12+26+43,154+38],[234,55]]);
  assert.deepEqual(U.n.map(a=>a.reduce((s,x)=>s+x,0)),[1835,2691]);assert.deepEqual(U.s.map(a=>a.reduce((s,x)=>s+x,0)),[557,1198]);
  assert.equal(U.s[0].filter((x,k)=>x/U.n[0][k]>U.s[1][k]/U.n[1][k]).length,4);
  for(const D of [K,U]){const R=reweightedTable(D,0),T=reweightedTable(D,1);D.s.forEach((a,g)=>near(R.pooled[g],a.reduce((s,x)=>s+x,0)/D.n[g].reduce((s,x)=>s+x,0)));near(T.counts[0].reduce((s,x)=>s+x,0),D.n[0].reduce((s,x)=>s+x,0));T.counts[0].forEach((x,k)=>near(x/T.counts[0].reduce((s,x)=>s+x,0),T.counts[1][k]/T.counts[1].reduce((s,x)=>s+x,0)));}
  assert.ok(reweightedTable(K,0).pooled[0]<reweightedTable(K,0).pooled[1]);assert.ok(reweightedTable(K,.9).pooled[0]>reweightedTable(K,.9).pooled[1]);
});
test('M-bias closed forms agree with independent noise expansions for every strength input and boundary',()=>{
  for(let si=0;si<=40;si++)for(let ei=0;ei<=30;ei++){const s=si*.05,e=ei*.05,E=[[0,2],[1,2],[0,3],[1,4],[3,4],[2,3]],f=(a,b)=>b===2?s:a===3&&b===4?1.3:a===2&&b===3?e:1,S=covariance(5,E,f),q=mBias(s,e);near(reg(S,4,[3])[0]-1.3,q.unadjusted);near(reg(S,4,[3,2])[0]-1.3,q.adjusted);if(s===0){near(q.adjusted,0);near(q.unadjusted,0);}}
});
test('all 32 bad-control subsets across every strength agree with independent path/noise regression',()=>{
  const E=[[2,0],[2,1],[0,3],[3,1],[0,1],[1,4],[0,5],[1,5],[2,6]];
  for(let k=0;k<=30;k++){const g=k*.05,w={'0>3':.9,'3>1':.7,'0>1':.5,'2>0':.8,'2>1':.8,'1>4':g,'0>5':g,'1>5':g,'2>6':.9},f=(a,b)=>w[`${a}>${b}`],B=coefMatrix(7,E,f),S=covariance(7,E,f),actual=semCov(7,B,Array(7).fill(1));for(let mask=0;mask<32;mask++){const z=[2,3,4,5,6].filter((_,j)=>mask>>j&1);near(popReg(actual,1,[0,...z])[0],reg(S,1,[0,...z])[0]);}near(reg(S,1,[0,2])[0],1.13);near(reg(S,1,[0,2,3])[0],.5);assert.ok(reg(S,1,[0,6])[0]>1.13);}
});
test('bow observational equivalence has different interventions, but equal q values can hide this particular witness',()=>{
  for(const p of [.1,.4,.9])for(const q0 of [.05,.25,.95])for(const q1 of [.05,.65,.95])for(const lambda of [0,.4,1]){
    const obs=Array(4).fill(0),d=[0,0];for(const u of [0,1])for(const t of [0,1]){const pu=u?p:1-p,pt=t?lambda:1-lambda,q=[q0,q1];obs[u+2]+=pu*pt*q[u];obs[u]+=pu*pt*(1-q[u]);for(const x of [0,1])d[x]+=pu*pt*q[t?u:x];}near(obs[0],(1-p)*(1-q0));near(obs[3],p*q1);near(d[1]-d[0],(1-lambda)*(q1-q0));
    // Off-diagonal response mechanisms supply a witness even if q0=q1.
    const A=[(1-p)*q0,p*q1+1-p],B=[(1-p)*q0+p,p*q1];near((A[1]-A[0])-(B[1]-B[0]),1);
  }
});
test('fixed SWIG nodes cannot become covariance indices; d-connection does not force dependence',()=>{
  const o={names:['L','A','Y'],e:[[0,1],[0,2],[1,2]],t:1,y:2,hid:[]};assert.equal(swigCovariate(o,0),true);for(const id of [-1,1,2,3,undefined])assert.equal(swigCovariate(o,id),false);
  assert.equal(dSep(4,[[0,1],[0,2],[3,2]],1,2,new Set([3])),false);assert.equal(dSep(4,[[0,1],[0,2],[3,2]],1,2,new Set([0,3])),true);
  const S=covariance(3,[[0,1],[0,2]],()=>0);near(S[1][2],0);
});
test('Lord completions have identical D=1 moments but different diet counterfactual effects at every reliability endpoint',()=>{
  // Symmetric sigma points reproduce the three independent N(0,1) first two moments exactly; no Monte Carlo claim.
  const points=Array.from({length:6},(_,k)=>Array.from({length:3},(_,j)=>j===Math.floor(k/2)?(k%2?1:-1)*Math.sqrt(3):0));
  for(const r of [.2,.6,1])for(const gap of [0,20,30])for(const g of [0,1])for(const story of ['trait','drift']){
    const A=points.map(z=>lordWeight(story,1,g,r,gap,...z)),mean=i=>A.reduce((s,a)=>s+a[i],0)/6,mu=60+(g?1:-1)*gap/2;near(mean(0),mu);near(mean(1),mu);near(A.reduce((s,a)=>s+(a[0]-mu)**2,0)/6,64);near(A.reduce((s,a)=>s+(a[1]-mu)**2,0)/6,64);near(A.reduce((s,a)=>s+(a[0]-mu)*(a[1]-mu),0)/6,64*r);const effect=points.reduce((s,z)=>s+lordWeight(story,1,g,r,gap,...z)[1]-lordWeight(story,0,g,r,gap,...z)[1],0)/6;near(effect,story==='trait'?0:(1-r)*(mu-60));near(lordPopulation(r,gap,story).differentialDietEffect,story==='trait'?0:(1-r)*gap);
  }
});
test('front-door equals independent intervention for positive original topology, and missing empirical strata are unavailable',()=>{
  const E=[[0,1],[0,3],[1,2],[2,3]];
  for(const c of [0,1.8,3]){const m=binModel(4,E,{seed:2,W:{'0>1':c,'0>3':c,'1>2':2.2,'2>3':1.6},B:{3:-.2}}),P=enumerate(m);for(const x of [0,1])near(supportedFrontDoor(P,4,1,2,3,x),probOf(enumerate(m,{1:x}),4,{3:1}));}
  const Q=Array(8).fill(0);Q[0]=.5;Q[7]=.5;assert.ok(Number.isNaN(supportedFrontDoor(Q,3,0,1,2,0)));assert.ok(Number.isNaN(supportedFrontDoor(Array(8).fill(0),3,0,1,2,0)));
  const possible=[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
  for(let mask=0;mask<64;mask++){const E=possible.filter((_,j)=>mask>>j&1),c1=!descendants(4,E.filter(([a,b])=>a!==2&&b!==2),1).has(3),c2=dSep(4,E.filter(([a])=>a!==1),1,2,new Set()),c3=dSep(4,E.filter(([a])=>a!==2),2,3,new Set([1]));if(c1&&c2&&c3){const m=binModel(4,E,{seed:13}),P=enumerate(m);for(const x of [0,1])near(supportedFrontDoor(P,4,1,2,3,x),probOf(enumerate(m,{1:x}),4,{3:1}));}}
  // Reproducible actual UI setting: one of 40 studies has no required (X,M) stratum.
  const E2=[...E,[1,3]],m=binModel(4,E2,{seed:2,W:{'0>1':0,'0>3':3,'1>2':2.2,'2>3':3,'1>3':-2},B:{0:0,1:0,2:0,3:-.2}}),P=jointP(m);
  const unavailable=[];for(let k=0;k<40;k++){const Q=sampleTable(P,200,2200+k);if(!Number.isFinite(supportedFrontDoor(Q,4,1,2,3,1)-supportedFrontDoor(Q,4,1,2,3,0)))unavailable.push(k);}
  assert.deepEqual(unavailable,[31]);
});
