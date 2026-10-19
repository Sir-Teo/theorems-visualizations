import test from 'node:test';import assert from 'node:assert/strict';
import {binaryFactor,structuralSample,structuralFit,noisyOr,tableAssociation,mosaicCells} from '../content/causal/graph-sources-audit.shared.js';
import {topoOrder,descendants,semCov,coefMatrix,pcorrCov} from '../content/causal/ch03.shared.js';
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const sum=a=>a.reduce((s,x)=>s+x,0), bit=(c,i)=>(c>>i)&1;
const arcs=Array.from({length:4},(_,a)=>Array.from({length:4},(_,b)=>[a,b])).flat().filter(([a,b])=>a!==b);
const dags=[];for(let mask=0;mask<4096;mask++){const E=arcs.filter((_,j)=>mask>>j&1);if(topoOrder(4,E))dags.push(E);}
const marginal=(P,nodes,values)=>sum(Array.from(P,(w,c)=>nodes.every((j,k)=>bit(c,j)===values[k])?w:0));
function localMarkov(P,E){for(let i=0;i<4;i++){
 const ds=descendants(4,E,i),pa=E.filter(([,b])=>b===i).map(([a])=>a),nd=[0,1,2,3].filter(j=>!ds.has(j)&&!pa.includes(j));
 for(let c=0;c<16;c++){const q=marginal(P,pa,pa.map(j=>bit(c,j))),joint=marginal(P,[i,...pa,...nd],[bit(c,i),...pa.map(j=>bit(c,j)),...nd.map(j=>bit(c,j))]),left=marginal(P,[i,...pa],[bit(c,i),...pa.map(j=>bit(c,j))]),right=marginal(P,[...pa,...nd],[...pa.map(j=>bit(c,j)),...nd.map(j=>bit(c,j))]);near(joint*q,left*right);}
}}
test('all543 four-node DAG factorizations normalize and satisfy the local Markov constraints, including zero cells',()=>{
 assert.equal(dags.length,543);
 for(const E of dags)for(let mode=0;mode<3;mode++){
  const W=Float64Array.from({length:16},(_,c)=>mode===0?c+1:mode===1?(c%3?0:c+1):c===5?1:0),F=binaryFactor(W,E);near(sum(F),1);for(const p of F)assert.ok(p>=0&&p<=1);localMarkov(F,E);const again=binaryFactor(F,E);for(let c=0;c<16;c++)near(again[c],F[c]);
  // An independent chain-rule oracle enumerates full predecessors of a complete order.
  const order=topoOrder(4,E),full=order.flatMap((i,j)=>order.slice(0,j).map(p=>[p,i])),sat=binaryFactor(W,full);for(let c=0;c<16;c++)near(sat[c],W[c]/sum(W));
 }
 assert.throws(()=>binaryFactor(new Float64Array(16),[[0,1],[1,0]]),/DAG/);
});
// Independent modified Gram–Schmidt least squares, rather than the implementation's normal equations.
function qr(X,y){const q=[],R=Array.from({length:X[0].length},()=>[]);for(let j=0;j<X[0].length;j++){const v=X.map(row=>row[j]);for(let k=0;k<j;k++){R[k][j]=sum(v.map((x,i)=>x*q[k][i]));for(let i=0;i<v.length;i++)v[i]-=R[k][j]*q[k][i];}R[j][j]=Math.sqrt(sum(v.map(x=>x*x)));q.push(v.map(x=>x/R[j][j]));}const beta=q.map(v=>sum(v.map((x,i)=>x*y[i])));for(let j=beta.length-1;j>=0;j--){for(let k=j+1;k<beta.length;k++)beta[j]-=R[j][k]*beta[k];beta[j]/=R[j][j];}return beta;}
test('structural sample fits agree with independent QR across81 coefficient worlds and preserve noises, not finite regression estimates',()=>{
 const base={a:.8,b:.9,c:.7,d:.6},D0=structuralSample(base),e0=structuralFit(D0);
 for(const a of [-1.5,0,1.5])for(const b of [-1.5,0,1.5])for(const c of [-1.5,0,1.5])for(const d of [-1.5,0,1.5]){
  const D=structuralSample({a,b,c,d}),e=structuralFit(D),want=[...qr(Array.from(D.Z,z=>[z]),D.X),...qr(Array.from(D.X,x=>[x]),D.M),...qr(Array.from(D.M,(m,i)=>[m,D.Z[i]]),D.Y)];for(let i=0;i<4;i++)near(e[i],want[i]);
  for(let i=0;i<D.Z.length;i++){assert.equal(D.Z[i],D0.Z[i]);near(D.X[i]-a*D.Z[i],D0.X[i]-base.a*D0.Z[i]);near(D.M[i]-b*D.X[i],D0.M[i]-base.b*D0.X[i]);near(D.Y[i]-c*D.M[i]-d*D.Z[i],D0.Y[i]-base.c*D0.M[i]-base.d*D0.Z[i]);}
 }
 const D=structuralSample({...base,a:-1.5}),e=structuralFit(D);near(e[0]-e0[0],-2.3);assert.ok(Math.abs(e[1]-e0[1])>1e-4);assert.ok(Math.abs(e[3]-e0[3])>1e-4);
 const DY=structuralSample({...base,c:-1.5});for(const k of ['Z','X','M'])assert.deepEqual(DY[k],D0[k]);
});
test('all29 positive Gaussian strengths agree with direct path-expansion full and conditional correlations',()=>{
 for(let j=0;j<=28;j++){const r=.2+j*.05,models=[[[0,1],[1,2]],[[1,0],[1,2]],[[0,1],[2,1]]],full=[r*r/Math.sqrt(r**4+r*r+1),r*r/(1+r*r),0],part=[0,0,-r*r/(1+r*r)];
  models.forEach((E,k)=>{const S=semCov(3,coefMatrix(3,E,r),[1,1,1]);near(pcorrCov(S,0,2,[]),full[k]);near(pcorrCov(S,0,2,[1]),part[k]);});
 }
});
test('432 noisy-OR worlds agree with independently constructed integer Bayes fractions and expose impossible events',()=>{
 for(const pb of [1,10,50])for(const pe of [1,15,50])for(const sb of [0,1,50,100])for(const se of [0,1,50,100])for(const l of [0,2,20]){
  const T=noisyOr(pb/100,pe/100,sb/100,se/100,l/100),weights={};let total=0n;
  for(const b of [0,1])for(const e of [0,1]){const w=BigInt(b?pb:100-pb)*BigInt(e?pe:100-pe)*(1000000n-BigInt(100-l)*BigInt(b?100-sb:100)*BigInt(e?100-se:100));weights[`${b}${e}`]=w;total+=w;}
  const ratio=(a,b)=>b===0n?null:Number(a)/Number(b);near(T.Z,Number(total)/1e10);
  const refs=[ratio(weights['10']+weights['11'],total),ratio(weights['11'],weights['01']+weights['11']),ratio(weights['10'],weights['00']+weights['10'])];[T.pA,T.pAq,T.pAn].forEach((x,j)=>refs[j]===null?assert.equal(x,null):near(x,refs[j]));
  if(total===0n){assert.equal(T.posterior,null);continue;}
  for(const k in weights)near(T.posterior[k],ratio(weights[k],total));const assoc=tableAssociation(T.posterior);assert.equal(assoc.kind,sb&&se?'negatively dependent':'independent');
  if(sb&&se)assert.ok(T.pAq<T.pA+1e-12);near(T.likelihood['00']*T.likelihood['11']-T.likelihood['10']*T.likelihood['01'],-(1-l/100)*sb/100*se/100);
 }
});
test('exact-area mosaics remain nonnegative, normalized and finite at all alarm corners, with truthful degenerate association',()=>{
 for(const pb of [.01,.5])for(const pe of [.01,.5])for(const sb of [0,1])for(const se of [0,1])for(const l of [0,.2])for(const P of Object.values(noisyOr(pb,pe,sb,se,l)).filter((_,i)=>false))void P;
 for(const pb of [.01,.5])for(const pe of [.01,.5])for(const sb of [0,1])for(const se of [0,1])for(const l of [0,.2]){const T=noisyOr(pb,pe,sb,se,l);for(const P of [T.prior,T.posterior]){const C=mosaicCells(P);if(!P){assert.deepEqual(C,[]);continue;}near(sum(C.map(c=>c.width*c.height)),1);for(const c of C){near(c.width*c.height,c.p);for(const x of [c.x,c.y,c.width,c.height])assert.ok(Number.isFinite(x)&&x>=0);assert.ok(c.x+c.width<=1+1e-12&&c.y+c.height<=1+1e-12);}}}
 assert.deepEqual(tableAssociation({'00':0,'01':.8,'10':0,'11':.2}),{OR:null,kind:'independent'});assert.equal(tableAssociation({'00':.1/1.4,'10':.2/1.4,'01':.2/1.4,'11':.9/1.4}).kind,'positively dependent');assert.equal(tableAssociation({'00':0,'10':0,'01':0,'11':1}).kind,'independent');
});
test('an open collider can be independent at one conditioning value; dependent noises do not imply the observed Markov property',()=>{
 // Independent fair A,C; P(B=1|A,C)=(.1,.2,.2,.4) is rank one.
 const B1={'00':.025,'10':.05,'01':.05,'11':.1},B0={'00':.225,'10':.2,'01':.2,'11':.15};
 assert.equal(tableAssociation(B1).kind,'independent');assert.equal(tableAssociation(B0).kind,'negatively dependent');
 // The unconditional A,C law is independent. Neither A–B nor C–B is independent,
 // unconditionally or given the remaining root, so this law is faithful to A→B←C.
 near(B1['10']+B1['11'],.15);near(B1['00']+B1['01'],.075);near(B1['10']/.25,.2);near(B1['00']/.25,.1);near(B1['11']/.25,.4);near(B1['01']/.25,.2);
 for(const k of ['00','10','01','11'])near(B1[k]+B0[k],.25);
 const observed=Float64Array.from([.5,0,0,.5]),empty=binaryFactor(observed,[]);for(const x of empty)near(x,.25);assert.ok(tvIndependent(observed,empty)>.4);
});
function tvIndependent(a,b){return sum(Array.from(a,(x,i)=>Math.abs(x-b[i])))/2;}
