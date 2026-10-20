import test from 'node:test';import assert from 'node:assert/strict';
import{shiftedPower,matching,regression}from'../content/psych/source-audit-scaling.js';
import{EXPS,EXP}from'../content/psych/ch03.shared.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('effective offsets raise the unshifted log slope and give the correct ratio and doubling level',()=>{
 for(const n of[.2,.33,.6,1.1,1.45,3.5,3.6])for(const offset of[0,.000001,.123456789,.3,.6]){
  const p=shiftedPower(n,offset),value=x=>10*Math.exp(n*Math.log((x-offset)/(1-offset)));near(p.atOne,10);near(p.atTwo,value(2));near(p.ratio,((2-offset)/(1-offset))**n);near(value(p.doubling),20);near(p.secant,Math.log(value(2)/value(1))/Math.log(2));
  for(const I of[1,2]){const h=1e-6,derivative=(Math.log(value(I*Math.exp(h)))-Math.log(value(I*Math.exp(-h))))/(2*h);near(I===1?p.slopeOne:p.slopeTwo,derivative,4e-9);}
  assert.ok(p.slopeOne>=n&&p.slopeTwo>=n);if(offset===0)near(p.secant,n);for(const[x,y]of[...p.curve,...p.baseline])assert.ok(x>p.x[0]&&x<p.x[1]&&y>p.y[0]&&y<p.y[1]);
 }
});
test('historical coefficient records preserve stated variables, conditions and source-specific loudness/length values',()=>{
 assert.equal(EXPS.length,14);assert.equal(EXP.loud.n,.6);assert.match(EXP.loud.name,/binaural/);assert.equal(EXP.len.n,1.1);assert.match(EXP.rough.name,/inverse.*grit/);assert.equal(EXP.rough.n,1.5);assert.match(EXP.bright.name,/5°/);assert.equal(EXP.sacch.n,.8);for(const e of EXPS)assert.ok(e.n>0&&e.n<=3.6);
});
function independentFit(points){const n=points.length,sx=points.reduce((s,p)=>s+p[0],0),sy=points.reduce((s,p)=>s+p[1],0),sxx=points.reduce((s,p)=>s+p[0]*p[0],0),sxy=points.reduce((s,p)=>s+p[0]*p[1],0);const slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);return{slope,intercept:(sy-slope*sx)/n};}
test('seeded matching obeys exponent-ratio algebra and independent OLS identities throughout preset/control corners',()=>{
 const choices=['bright','loud','len','heavy','shock'];let cases=0;
 for(const ia of choices)for(const ib of choices)for(const sd of[0,.06,.123456789,.25])for(const seed of[1,8,999999]){
  const a=EXP[ia].n,b=EXP[ib].n,p=matching(a,b,sd,seed);assert.deepEqual(p,matching(a,b,sd,seed));for(const[k,points]of[['forward',p.AB],['reverse',p.BA.map(([x,y])=>[y,x])],['pooledReverse',p.BA]]){const f=independentFit(points);near(p[k].slope,f.slope);near(p[k].intercept,f.intercept);}
  p.AB.forEach(([x,y],i)=>{near(x,i/(4*a));if(sd===0)near(y,i/(4*b));});p.BA.forEach(([x,y],i)=>near(y,i/(4*b)));if(sd===0){near(p.forward.slope,a/b);near(p.inverse,a/b);near(p.geometric,a/b);}
  for(const[x,y]of[...p.AB,...p.BA,...p.fit,[0,0],[2/a,2/b]])assert.ok(x>p.x[0]&&x<p.x[1]&&y>p.y[0]&&y<p.y[1]);cases++;
 }assert.equal(cases,300);
});
test('three-way exact matching composes and transformed roughness has the opposite exponent sign',()=>{
 for(const a of EXPS)for(const b of EXPS)for(const c of EXPS)near((a.n/b.n)*(b.n/c.n),a.n/c.n);for(const grit of[12,24,120,320])near(grit**-1.5,(1/grit)**1.5);
});
test('invalid finite model inputs are rejected instead of silently changing source assumptions',()=>{
 for(const args of[[NaN],[0],[3.7],[.6,-.1],[.6,.61]])assert.throws(()=>shiftedPower(...args),RangeError);
 for(const args of[[NaN,1],[1,0],[1,1,-.1],[1,1,.3],[1,1,0,0],[1,1,0,1.5],[1,1,0,1000000]])assert.throws(()=>matching(...args),RangeError);
 const p=[[0,1],[1,3],[2,5]];assert.deepEqual(regression(p),{slope:2,intercept:1});
});
