import test from 'node:test';
import assert from 'node:assert/strict';
import {CPG_PLUS,CPG_MINUS,BETA,casino,viterbi,posterior,forwardScaled,estimateChain} from '../content/bioinf/ch04.shared.js';
import {neighborMap,blastSearch,codes,matFlat,expect,NCBI} from '../content/bioinf/ch03.shared.js';
const near=(a,b,e=1e-12)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('CpG source table, rounding correction, and direct transition counts',()=>{
 const plus=[[.180,.274,.426,.120],[.171,.368,.274,.188],[.161,.339,.375,.125],[.079,.355,.384,.182]],minus=[[.300,.205,.285,.210],[.322,.298,.078,.302],[.248,.246,.298,.208],[.177,.239,.292,.292]];
 for(const[printed,actual]of[[plus,CPG_PLUS],[minus,CPG_MINUS]])for(let i=0;i<4;i++){const sum=printed[i].reduce((a,b)=>a+b,0);near(actual[i].reduce((a,b)=>a+b),1);for(let j=0;j<4;j++)near(actual[i][j],printed[i][j]/sum);}
 near(CPG_PLUS[1][2],.274/1.001);for(let i=0;i<4;i++)for(let j=0;j<4;j++)near(BETA[i][j],Math.log2(CPG_PLUS[i][j]/CPG_MINUS[i][j]));
 const fit=estimateChain(Uint8Array.from([0,1,0,1,2,1,3]));assert.deepEqual(fit.C,[[0,2,0,0],[1,0,1,1],[0,1,0,0],[0,0,0,0]]);assert.deepEqual(fit.P[1],[1/3,0,1/3,1/3]);
});
test('casino emissions, stationary starts and expected run lengths match the original example',()=>{
 const h=casino();assert.deepEqual(h.A,[[.95,.05],[.1,.9]]);assert.deepEqual(h.E[1],[.1,.1,.1,.1,.1,.5]);near(h.pi[0],2/3);near(h.pi[1],1/3);for(let k=0;k<2;k++)near(h.pi.reduce((s,p,j)=>s+p*h.A[j][k],0),h.pi[k]);near(1/h.A[0][1],20);near(1/h.A[1][0],10);
});
test('HMM forward, Viterbi and posterior independently agree with exhaustive path probabilities',()=>{
 for(const p6 of [.2,.5,.9])for(const[aFL,aLF]of[[.01,.4],[.05,.1],[.2,.02]]){
  const h=casino({p6,aFL,aLF}),obs=[5,5,0,3,5,1,5],T=obs.length,weights=[],marg=Array.from({length:T},()=>[0,0]);let total=0,max=0;
  for(let mask=0;mask<2**T;mask++){const path=Array.from({length:T},(_,t)=>(mask>>t)&1);let w=h.pi[path[0]]*h.E[path[0]][obs[0]];for(let t=1;t<T;t++)w*=h.A[path[t-1]][path[t]]*h.E[path[t]][obs[t]];weights.push({path,w});total+=w;max=Math.max(max,w);for(let t=0;t<T;t++)marg[t][path[t]]+=w;}
  near(Math.exp(forwardScaled(h,obs).logL),total);const v=viterbi(h,obs);near(Math.exp(v.logp),max);assert.ok(weights.some(p=>p.w===max&&p.path.every((s,t)=>s===v.path[t])));const P=posterior(h,obs);for(let t=0;t<T;t++)for(let k=0;k<2;k++)near(P.gamma[t][k],marg[t][k]/total);
 }
});
test('scored-word neighbourhood and ungapped extensions checked against explicit enumeration',()=>{
 const S=matFlat('blosum62'),q=codes('ARNDCQ'),w=2,T=7,nb=neighborMap(q,S,w,T);let pairs=0,words=0;
 for(let a=0;a<20;a++)for(let b=0;b<20;b++){const positions=[];for(let i=0;i+w<=q.length;i++)if(S[q[i]*20+a]+S[q[i+1]*20+b]>=T)positions.push(i);const got=nb.map[a*20+b]||[];assert.deepEqual(got,positions);pairs+=positions.length;if(positions.length)words++;}assert.equal(nb.pairs,pairs);assert.equal(nb.nWords,words);
 const target=codes('VVARNDCQWW'),R=blastSearch(q,target,nb,S,{w,X:40,twoHit:false});
 let best=0;for(let i=0;i<q.length;i++)for(let j=0;j<target.length;j++){let s=0;for(let n=0;i+n<q.length&&j+n<target.length;n++){s+=S[q[i+n]*20+target[j+n]];best=Math.max(best,s);}}
 assert.equal(Math.max(...R.hsps.map(x=>x.score)),best);for(const h of R.hsps){let s=0;for(let k=0;k<h.i1-h.i0;k++)s+=S[q[h.i0+k]*20+target[h.j0+k]];assert.equal(h.score,s);assert.equal(h.i1-h.i0,h.j1-h.j0);}
});
test('E-value is an expected count, with a bounded Poisson probability of at least one',()=>{
 for(const score of [1,10,30,60,100]){const E=expect(score,NCBI.blosum62,200,1e6),p=-Math.expm1(-E);assert.ok(p>=0&&p<=1);if(E>1)assert.ok(E>p);if(E<1e-3)assert.ok(Math.abs(p/E-1)<E);}
});
