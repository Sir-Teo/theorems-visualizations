import test from 'node:test';import assert from 'node:assert/strict';
import {juryEquilibrium,maxOpenHalfplane,gains,diffDist,swingEq,isStrictSinglePeaked} from '../content/polsci/verification-models.js';
import {binomPmf,majProb} from '../content/polsci/ch05.shared.js';
import {mixGrid,cdfOf,gridMedian,votes2} from '../content/polsci/ch04.shared.js';
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
const choose=(n,k)=>{let v=1;for(let j=1;j<=k;j++)v*= (n-j+1)/j;return v;};
const pmf=(n,k,p)=>choose(n,k)*p**k*(1-p)**(n-k);
test('jury equilibrium satisfies both signal best responses, including guilty-signal mixing',()=>{
 let mixedG=false,mixedI=false;
 for(const n of [1,3,5,11])for(const k of [1,Math.ceil(n/2),n])for(const q of [.55,.7,.95])for(const pi of [.2,.5,.8])for(const z of [.2,.5,.8]){
  const e=juryEquilibrium(n,k,q,pi,z),ag=q*e.guilty+(1-q)*e.innocent,ai=(1-q)*e.guilty+q*e.innocent;
  assert.ok(e.guilty>=e.innocent&&e.innocent>=0&&e.guilty<=1);
  const pg=pmf(n-1,k-1,ag),pn=pmf(n-1,k-1,ai);
  for(const [prob,sG,sI] of [[e.guilty,q,1-q],[e.innocent,1-q,q]]){
   const num=pi*sG*pg,den=num+(1-pi)*sI*pn;
   if(den<1e-15)continue;
   const post=num/den;
   if(prob>1e-10&&prob<1-1e-10)near(post,z);else if(prob===0)assert.ok(post<=z+1e-9);else assert.ok(post>=z-1e-9);
  }
  let ci=0,convG=0;for(let j=k;j<=n;j++){ci+=pmf(n,j,ai);convG+=pmf(n,j,ag);}near(e.ci,ci);near(e.ag,1-convG);
  mixedG ||= e.guilty>0&&e.guilty<1;mixedI ||= e.innocent>0&&e.innocent<1;
 }
 assert.ok(mixedG&&mixedI);
 const e=juryEquilibrium(11,6,.7,.2,.8);assert.ok(e.guilty<.8&&e.guilty>.7);assert.equal(e.innocent,0);
});
test('unanimity converges to the corrected primary limit and majority errors vanish',()=>{
 const q=.7,z=.5,f=(1-z)*(1-q)/(z*q),limit=f**(q/(2*q-1));
 const n=2001,e=juryEquilibrium(n,n,q,.5,z);near(e.ci,limit,.0004);
 const m=juryEquilibrium(101,51,q,.2,.8);assert.ok(m.ci<.001&&m.ag<.001);
});
test('half-plane equilibrium criterion handles coincident ideals and arbitrarily small asymmetric perturbations',()=>{
 // Three coincident voters already make the center unbeatable; the other two need not be antipodal.
 const V=[[0,0],[0,0],[0,0],[1,0],[0,1]];assert.equal(maxOpenHalfplane(V,[0,0]),2);
 const S=[[0,0],[1,0],[-1,0],[0,1],[0,-1]];assert.equal(maxOpenHalfplane(S,[0,0]),2);
 S[2]=[-1,.00001];assert.equal(maxOpenHalfplane(S,[0,0]),3);
 assert.equal(maxOpenHalfplane([[0,0],[0,0],[0,0]],[0,0]),0);
});
test('median convergence survives bimodal full-turnout electorates',()=>{
 for(const comps of [[[.5,2.8,1.1],[.5,7.2,1.1]],[[.6,3.5,1.1],[.4,6.6,2.1]]]){
  const w=mixGrid(201,comps),F=cdfOf(w),m=gridMedian(w);near(votes2(F,m,m,10.5)[0],.5);
  for(let j=0;j<=200;j++)assert.ok(votes2(F,j*.05,m,10.5)[0]<=.5+1e-12);
 }
});
test('majority calculation agrees with independent enumeration and correlated boundary is (1+p)/2',()=>{
 for(const n of [1,3,5,11])for(const p of [.3,.5,.7]){let s=0;for(let k=(n+1)/2;k<=n;k++)s+=pmf(n,k,p);near(majProb(n,p),s);}
 const p=.7,r=1-1/(2*p),conditionalWrong=(1-r)*p;near(conditionalWrong,.5);
 const actual=p*majProb(1001,r+(1-r)*p)+(1-p)*majProb(1001,conditionalWrong);near(actual,(1+p)/2,.00001);
});
test('swing gains agree with exhaustive worlds; perfect information and even-count boundary are weak cases',()=>{
 const nI=3,q=.8,a=.2,b=.3,nU=3;
 // Enumerate each other informed vote and each uninformed action in both states.
 const val=d=>d>0?1:d===0?.5:0;let A=0,B=0;
 for(const state of [0,1]){
  const opts=Array.from({length:nI},()=>[[1,state?1-q:q],[-1,state?q:1-q]]).concat(Array.from({length:nU-1},()=>[[1,a],[-1,b],[0,1-a-b]]));
  const walk=(j,d,mass)=>{if(j===opts.length){const sign=state?-1:1;A+=.5*mass*sign*(val(d+1)-val(d));B+=.5*mass*sign*(val(d-1)-val(d));return;}for(const [step,p] of opts[j])walk(j+1,d+step,mass*p);};walk(0,0,1);
 }
 const g=gains(nI,q,0,0,nU,a,b);near(g.gA,A);near(g.gB,B);
 assert.ok(gains(3,.8,0,0,4,0,0).gA<0);near(gains(3,1,0,0,4,0,0).gA,0);near(gains(4,.8,0,0,4,0,0).gA,0);
 const e=swingEq(5,.7,1,2,4),G=gains(5,.7,1,2,4,e.al,e.be);near(e.regret,Math.max(0,G.gA,G.gB)-e.al*G.gA-e.be*G.gB);assert.ok(e.regret>=-1e-12);
});

test('a single strict local maximum does not certify a single-peaked curve when a second plateau rises again',()=>{
 assert.equal(isStrictSinglePeaked([1,0,0,.9,.9,.9]),false);
 assert.equal(isStrictSinglePeaked([1,2,3,2,1]),true);
 assert.equal(isStrictSinglePeaked([1,2,2,1]),false);
});
