import test from 'node:test';
import assert from 'node:assert/strict';
import { dSep, semCov, pcorrCov } from '../content/causal/ch03.shared.js';
import { popReg } from '../content/causal/ch04.shared.js';
import { noisyOrAlarmTable } from '../content/causal/ch03-b.js';
import { frontDoor } from '../content/causal/ch04-b.js';

test('Gaussian triples agree with independent analytic marginal and conditional covariances',()=>{
 for(const b of [0,.2,.8,1.2]){
  const chain=semCov(3,[[0,0,0],[b,0,0],[0,b,0]],[1,1,1]);
  assert.ok(Math.abs(chain[0][2]-b*b)<1e-12);assert.ok(Math.abs(pcorrCov(chain,0,2,[1]))<1e-12);
  const collider=semCov(3,[[0,0,0],[b,0,b],[0,0,0]],[1,1,1]);
  assert.equal(collider[0][2],0);assert.ok(Math.abs(pcorrCov(collider,0,2,[1])+b*b/(1+b*b))<1e-12);
  assert.equal(dSep(3,[[0,1],[2,1]],0,2,new Set()),true);
  assert.equal(dSep(3,[[0,1],[2,1]],0,2,new Set([1])),false);
 }
});

test('M-bias population regression matches a direct covariance derivation with unit equation noises',()=>{
 // Z=sU1+sU2+eZ; X=U1+eX; Y=theta X+U2+eY.
 for(const s of [0,.2,1,2])for(const theta of [0,1,2]){
  const S=semCov(5,[[0,0,0,0,0],[0,0,0,0,0],[s,s,0,0,0],[1,0,0,0,0],[0,1,0,theta,0]],[1,1,1,1,1]);
  assert.ok(Math.abs(popReg(S,4,[3])[0]-theta)<1e-12);
  const exactBias=-s*s/(3*s*s+2);
  assert.ok(Math.abs(popReg(S,4,[3,2])[0]-theta-exactBias)<1e-12);
 }
});

test('noisy-OR posterior odds obey the analytic likelihood cross-ratio, including degenerate alarms',()=>{
 for(const [sB,sE,leak]of [[.95,.5,.02],[0,.5,.02],[1,1,0],[0,0,0]]){
  const T=noisyOrAlarmTable(.1,.15,sB,sE,leak);const Z=Object.values(T).reduce((s,c)=>s+c.pri*c.al,0);
  assert.ok(Math.abs(Object.values(T).reduce((s,c)=>s+c.pri,0)-1)<1e-14);
  if(!Z){assert.equal(sB+sE+leak,0);continue;}
  const q=Object.fromEntries(Object.entries(T).map(([k,c])=>[k,c.pri*c.al/Z]));
  const determinant=q['00']*q['11']-q['01']*q['10'];assert.ok(determinant<=1e-14);
  if(sB===0||sE===0)assert.ok(Math.abs(determinant)<1e-14);
 }
 // Counterexample to the former “AND means positive” claim: AND=true fixes both causes.
 const conditionedAND=[0,0,0,1];assert.equal(conditionedAND[3]*conditionedAND[0]-conditionedAND[1]*conditionedAND[2],0);
});

test('SWIG d-connection permits accidental independence instead of asserting dependence for every model',()=>{
 const graph=[[0,1],[0,2]];assert.equal(dSep(3,graph,1,2,new Set()),false);
 const zeroCoefficient=semCov(3,[[0,0,0],[0,0,0],[.8,0,0]],[1,1,1]);
 assert.ok(Math.abs(pcorrCov(zeroCoefficient,1,2,[]))<1e-14);
 assert.equal(dSep(3,graph,1,2,new Set([0])),true);
});

test('front-door identification matches direct latent-model intervention without using latent strata in the estimate',()=>{
 // U→X→M→Y and U→Y, all probabilities deliberately distinct.
 const pU=.3,pX=[.15,.8],pM=[.2,.75],pY=[[.05,.45],[.35,.85]];
 const P=new Float64Array(16);
 for(let u=0;u<2;u++)for(let x=0;x<2;x++)for(let m=0;m<2;m++)for(let y=0;y<2;y++){
  P[u+2*x+4*m+8*y]=(u?pU:1-pU)*(x?pX[u]:1-pX[u])*(m?pM[x]:1-pM[x])*(y?pY[u][m]:1-pY[u][m]);
 }
 for(const x of [0,1]){
  let intervention=0;for(let u=0;u<2;u++)for(let m=0;m<2;m++)intervention+=(u?pU:1-pU)*(m?pM[x]:1-pM[x])*pY[u][m];
  assert.ok(Math.abs(frontDoor(P,4,1,2,3,x)-intervention)<1e-14);
 }
});
