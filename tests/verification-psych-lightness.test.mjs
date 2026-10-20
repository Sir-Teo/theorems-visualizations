import test from 'node:test';import assert from 'node:assert/strict';
import{cornsweet,anchors,adaptingUnit,fading,REFLECTANCES}from'../content/psych/source-audit-lightness.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('compact cusp has exactly equal endpoints; zero cutoff telescopes and complete cover erases the cusp',()=>{
 for(const a of[.04,.16,.3])for(const w of[.3,1.23456789,3])for(const c of[2.5,5,7.5])for(const h of[0,.8,2.5])for(const shape of['cusp','step'])for(const cover of[false,true]){
  const p=cornsweet(a,w,c,h,0,cover,shape);assert.equal(p.L.length,501);assert.equal(p.xs[0],0);assert.equal(p.xs.at(-1),10);for(let i=0;i<501;i++){near(p.P[i]-p.P[0],p.L[i]-p.L[0]);assert.ok(p.P[i]>p.y[0]&&p.P[i]<p.y[1]&&p.L[i]>p.y[0]&&p.L[i]<p.y[1]);}if(shape==='cusp')assert.equal(p.physicalDifference,0);
 }
 const covered=cornsweet(.3,1.4,5,1.5,1.5,true);assert.ok(covered.L.every(x=>x===.5));assert.equal(covered.modelDifference,0);assert.equal(covered.clipped,0);
});
test('hard threshold uses the actual finite increments and inclusive equality, and partial covers can create new edges',()=>{
 for(const a of[.04,.3])for(const w of[.3,3])for(const c of[2.5,5,7.5])for(const h of[0,.8,2.5])for(const cutoff of[0,.123456789,1.5])for(const shape of['cusp','step']){
  const p=cornsweet(a,w,c,h,cutoff,true,shape),raw=[p.L[0]];for(let i=1;i<p.N;i++){const increment=p.L[i]-p.L[i-1];raw.push(raw.at(-1)+(Math.abs(increment)>=cutoff*.02?increment:0));}const shift=.5-(raw[0]+raw.at(-1))/2;raw.forEach((x,i)=>near(p.P[i],x+shift));near((p.P[0]+p.P.at(-1))/2,.5);
 }
 const p=cornsweet(.16,1.4,5,.8,.35,true);assert.ok(p.kept.some(x=>x!==0));assert.ok(Math.abs(p.modelDifference)>0);
 const base=cornsweet(.16,1.4,5,0,0,false),i=base.increments.findIndex(x=>x!==0),d=Math.abs(base.increments[i])/.02,pair=cornsweet(.16,1.4,5,0,d,false);near(pair.kept[i],base.increments[i]);
});
test('local/global assignments are a convex mixture and full local anchoring needs the reference maximum',()=>{
 for(const strength of[1,1.00001,10,30])for(const weight of[0,.123456789,1])for(let c=3;c<=11;c++){
  const p=anchors(strength,weight,c);assert.equal(p.lit.filter(Boolean).length,6);for(let i=0;i<14;i++){const framework=p.lit[i]?REFLECTANCES.filter((_,j)=>p.lit[j]):REFLECTANCES.filter((_,j)=>!p.lit[j]),localMax=strength===1?.9:Math.max(...framework),local=.9*p.R[i]/localMax;near(p.localP[i],local);near(p.P[i],weight*local+(1-weight)*.9*p.L[i]/Math.max(...p.L));assert.ok(p.P[i]>0&&p.P[i]<=.9+1e-14);for(const x of[p.R[i],p.P[i]])assert.ok(Math.log10(x)>p.x[0]&&Math.log10(x)<p.x[1]);}if(strength===1)p.P.forEach((x,i)=>near(x,p.R[i]));
 }
 const missing=anchors(10,1,6);assert.ok(missing.meanAbsLogError>0);assert.ok(missing.localP[3]>missing.R[3]);
});
function integrate(t,tau,A,f){const steps=Math.max(1,Math.ceil(t/.001)),dt=t/steps;let a=0;const force=(s,x)=>(.5+A*Math.sin(2*Math.PI*f*s)-x)/tau;for(let i=0;i<steps;i++){const s=i*dt,k1=force(s,a),k2=force(s+dt/2,a+dt*k1/2),k3=force(s+dt/2,a+dt*k2/2),k4=force(s+dt,a+dt*k3);a+=dt*(k1+2*k2+2*k3+k4)/6;}return a;}
test('exact adapting response agrees with independent RK4 and satisfies initial, constant-input and derivative identities',()=>{
 for(const tau of[.1,.731234,2,10])for(const A of[0,.123456789,.45])for(const f of[.1,.8,3])for(const t of[0,.123456789,3.5,20]){const p=adaptingUnit(t,tau,A,f);near(p.a,integrate(t,tau,A,f),2e-8);near(p.r,p.u-p.a);assert.ok(p.proxy>=0&&p.proxy<=1);if(!t){near(p.a,0);near(p.proxy,1);}if(!A)near(p.r,.5*Math.exp(-t/tau));if(t>1e-5&&t<19.99999){const h=1e-6,der=(adaptingUnit(t+h,tau,A,f).a-adaptingUnit(t-h,tau,A,f).a)/(2*h);near(der,(p.u-p.a)/tau,1e-8);}}
});
test('fading controls recompute exact histories rather than carrying old parameter states',()=>{
 for(const t of[0,.123456789,20])for(const blur of[.05,1.4,3])for(const motion of[0,.123456789,.4]){const p=fading(t,blur,motion);assert.equal(p.units.length,6);assert.deepEqual(p,fading(t,blur,motion));p.curves.forEach((curve,i)=>{assert.equal(curve[0][1],1);for(const[x,y]of curve){assert.ok(x>=0&&x<=20&&y>=0&&y<=1);if(motion===0)near(y,Math.exp(-x/p.taus[i]));}});}
});
test('malformed model inputs are rejected before numerical or visual work',()=>{
 for(const a of[[NaN],[0],[.16,.1],[.16,1.4,2],[.16,1.4,5,-1],[.16,1.4,5,1,-.1],[.16,1.4,5,1,.3,1]])assert.throws(()=>cornsweet(...a),RangeError);
 for(const a of[[0],[31],[10,-1],[10,.5,2],[10,.5,4.1]])assert.throws(()=>anchors(...a),RangeError);
 for(const a of[[-1],[21],[3.5,.01],[3.5,1,.5]])assert.throws(()=>fading(...a),RangeError);
});
