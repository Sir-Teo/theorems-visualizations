import test from 'node:test';
import assert from 'node:assert/strict';
import {attachmentRng as rng,growNonlinearTree as tree,growAttachmentMixture as mix,finiteAttachmentShift as shift,attachmentRateLaw as rate,attachmentStationary as law,attachmentCounts as counts,attachmentSurvival as survival,approximateAttachmentTail as tail,attachmentLogView as logView} from '../content/soc/source-audit-attachment.js';
const near=(a,b,t=2e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function directTree(n,g,R){const d=[1,1],parents=[-1,0];for(let v=2;v<n;v++){const w=d.map(k=>k**g),x=R()*w.reduce((a,b)=>a+b,0);let s=0,target=v-1;for(let i=0;i<v;i++){s+=w[i];if(x<s){target=i;break;}}d[target]++;d.push(1);parents.push(target);}return{d,parents};}
function recordDegrees(n,ends){const d=Array(n).fill(0);for(const v of ends){assert.ok(v>=0&&v<n);d[v]++;}return d;}
function directMixture(n,m,p,R){const edges=[];for(let i=1;i<=m;i++)for(let j=0;j<i;j++)edges.push([i,j]);let repeated=0;for(let v=m+1;v<n;v++){const old=edges.flat(),selected=[];for(let j=0;j<m;j++){const coin=R(),u=R();selected.push(coin<p?Math.floor(u*v):old[Math.floor(u*old.length)]);}repeated+=selected.length-new Set(selected).size;selected.forEach(t=>edges.push([t,v]));}return{ends:edges.flat(),repeated};}
test('Nonlinear trees: independent cumulative-weight reference, every kernel control value, exact edge records and boundary uniforms',()=>{
  for(let j=0;j<=40;j++)for(let seed=0;seed<8;seed++){const g=j/20,n=40,q=tree(n,g,rng(seed)),ref=directTree(n,g,rng(seed));assert.deepEqual(Array.from(q.degrees),ref.d);assert.deepEqual(Array.from(q.parents),ref.parents);assert.equal(q.edges,n-1);const ends=[];for(let v=1;v<n;v++){assert.ok(q.parents[v]<v);ends.push(v,q.parents[v]);}assert.deepEqual(recordDegrees(n,ends),ref.d);assert.equal(ref.d.reduce((a,b)=>a+b,0),2*(n-1));}
  for(const g of[0,.25,.95,1,1.05,1.5,2])for(const u of[0,.5,1-2**-53]){const q=tree(1000,g,()=>u),ref=directTree(1000,g,()=>u);assert.deepEqual(Array.from(q.degrees),ref.d);assert.deepEqual(Array.from(q.parents),ref.parents);}
  for(const g of[0,.95,1,1.05,2]){const q=tree(20000,g,rng(17));assert.equal(q.degrees.reduce((a,b)=>a+b,0),39998);assert.ok(q.degrees.every(k=>k>=1&&k<=19999));}
});
test('Frozen pre-arrival mixture probabilities: independent edge-list reference, exact degree conservation and retained parallel records',()=>{
  for(let m=1;m<=6;m++)for(let j=0;j<=20;j++){const p=j/20,n=m+25,q=mix(n,m,p,rng(23)),ref=directMixture(n,m,p,rng(23));assert.deepEqual(Array.from(q.ends),ref.ends);assert.equal(q.repeated,ref.repeated);assert.deepEqual(Array.from(q.degrees),recordDegrees(n,ref.ends));assert.equal(q.edges,m*n-m*(m+1)/2);assert.equal(q.ends.length,2*q.edges);for(let i=m*(m+1);i<q.ends.length;i+=2)assert.ok(q.ends[i]<q.ends[i+1]);}
  const q=mix(4,2,0,(()=>{let i=0;return()=>i++%2?.999:0;})());assert.deepEqual(Array.from(q.degrees),[2,4,2,2]);assert.equal(q.repeated,1);assert.deepEqual(Array.from(q.ends).slice(-4),[1,3,1,3]);
  for(let m=1;m<=6;m++){const n=1000,q=mix(n,m,1,()=>1-2**-53);assert.equal(q.repeated,(m-1)*(n-m-1));assert.equal(q.degrees.reduce((a,b)=>a+b,0),2*m*n-m*(m+1));assert.equal(q.edges,m*n-m*(m+1)/2);}
});
test('Finite seed-dependent affine identity and DMS degree convention; pure uniform endpoint is separate',()=>{
  for(let m=1;m<=6;m++)for(const n of[m+1,100,1000])for(const p of[0,.05,.5,.8,.95,1]){const q=mix(n,m,p,rng(7)),f=shift(n,m,p),D=Array.from(q.degrees).reduce((a,b)=>a+b,0);assert.equal(f.degreeSum,D);if(p===1){assert.equal(f.a,null);assert.equal(law(m,p,100).gamma,null);continue;}const aInf=2*m*p/(1-p);near(aInf-f.a,m*(m+1)*p/((1-p)*n));for(const k of q.degrees){const W=p/n+(1-p)*k/D;near(W,(k+f.a)/(D+n*f.a));}near(2+(m+aInf)/m,3+aInf/m);}
});
test('Stationary recurrence: closed exponent-3 law, normalized tail and mean identities, affine hypotheses and geometric limit',()=>{
  for(let m=1;m<=6;m++)for(const a of[-.9*m,-.5*m,0,.5*m,2*m,20*m]){const q=rate(m,a,10000);let mass=0,mean=0;for(let k=m;k<q.P.length;k++){const P=q.P[k];assert.ok(P>0);mass+=P;mean+=k*P;near(P+q.beta*(k+a)*P-(k>m?q.beta*(k-1+a)*q.P[k-1]:0),k===m?1:0);if(a===0)near(P,2*m*(m+1)/(k*(k+1)*(k+2)));}near(mass+q.tail,1);near(mean+(10001+q.beta*a)/(1-q.beta)*q.tail,2*m,2e-11);near(q.gamma,3+a/m);if(a===0)near(q.P[10000]*10000**3,2*m*(m+1),.0004);}
  for(let m=1;m<=6;m++){const q=law(m,1,200);let mass=0,mean=0;for(let k=m;k<=200;k++){near(q.P[k],(m/(m+1))**(k-m)/(m+1));mass+=q.P[k];mean+=k*q.P[k];}near(mass+q.tail,1);near(mean+q.tail*(201+m),2*m);assert.equal(q.a,null);assert.equal(q.beta,null);assert.equal(q.gamma,null);const almost=law(m,1-1e-9,200);for(let k=m;k<=200;k++)near(almost.P[k],q.P[k],1e-8);}
});
test('Complete empirical frequencies/survival, approximate tail support/null distinction, log padding and parameter guards',()=>{
  const d=[1,1,2,4,4,4],c=counts(d),S=survival(d);assert.deepEqual(c,[[1,2],[2,1],[4,3]]);assert.deepEqual(S,[[1,1],[2,4/6],[4,3/6]]);assert.deepEqual(tail(d,6),{kmin:6,n:0,estimate:null,sufficient:false});
  for(const n of[1,49,50,100]){const q=tail(Array(n).fill(8),6);near(q.estimate,1+1/Math.log(8/5.5));assert.equal(q.n,n);assert.equal(q.sufficient,n>=50);}
  for(const[lo,hi]of[[1,2],[1,20000],[1e-30,1],[6,6]]){const[a,b]=logView(lo,hi);assert.ok(a>0&&a<lo&&b>hi);}
  for(const f of[()=>mix(100,0,.5,rng(1)),()=>mix(100,2,1.1,rng(1)),()=>tree(100,-1,rng(1)),()=>tree(100,1,()=>1),()=>rate(2,-2,100),()=>law(2,.5,1),()=>tail(d,1)])assert.throws(f,RangeError);
});
