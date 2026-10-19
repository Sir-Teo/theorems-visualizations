import {pbpkSystem} from '../content/pharm/pbpk.shared.js';
import { infusionRegimen } from '../content/pharm/infusion-regimen.shared.js';
import { cSS, meanOver, extrema } from '../content/pharm/ch04.shared.js';
import { ANAES, mamm, cshtHold, cshtRate, cDecay, rk4 } from '../content/pharm/ch03.shared.js';
import { renalScaling } from '../content/pharm/renal.shared.js';
import { simulateRecirculation, recirculationTailAUC } from '../content/pharm/recirculation.shared.js';
import test from 'node:test';import assert from 'node:assert/strict';
import { hepaticExposure, oralTailAUC } from '../content/pharm/liver.shared.js';
import { bateman } from '../content/pharm/ch03.shared.js';
const close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('oral exposure has inverse capacity sensitivity at low and high extraction',()=>{
 for(const Q of [40,90,160])for(const x of [1,150,5000]){const h=hepaticExposure(Q,x,.9,.8,100);close(h.availability*100/h.clearance,h.oralAUC);close(h.oralAUC,72/x);close(hepaticExposure(Q,x/4,.9,.8,100).oralAUC/h.oralAUC,4);close(hepaticExposure(Q,3*x,.9,.8,100).oralAUC/h.oralAUC,1/3);close(h.clearance/Q+h.survival,1);}
});
test('whole-blood first-pass calculation uses the cited 1500mL/min = 90L/h reference',()=>{
 close(1500/1000*60,90);const h=hepaticExposure(90,150);close(h.extraction,.625);close(h.clearance,56.25);close(h.survival,.375);
});
test('oral AUC tail includes unabsorbed drug, including coincident absorption/elimination rates',()=>{
 for(const ka of [.1,1])for(const k of [.01,.1,1,1.6])for(const T of [.1,2,6]){
  const F=.7,D=100,V=40,n=20000,dt=T/n;let sum=0;
  for(let i=0;i<=n;i++){const w=i===0||i===n?1:i%2?4:2;sum+=w*bateman(F,D,V,ka,k,i*dt);}
  const tail=oralTailAUC(bateman(F,D,V,ka,k,T),F,D,V,ka,k,T);close(sum*dt/3+tail,F*D/(V*k),1e-8);
 }
});

test('meal recirculation conserves drug and its exact remaining tail recovers the geometric exposure',()=>{
 const trap=(x,y)=>y.slice(1).reduce((s,v,i)=>s+(v+y[i])*(x[i+1]-x[i])/2,0);
 for(const fb of [0,.5,.9])for(const fr of [0,.8,1])for(const mealGap of [4,10]){
  const r=simulateRecirculation({biliary:fb,reabsorbed:fr,mealGap});
  const e=r.end;close(e.A+e.G+e.GB+e.feces+e.el,100,2e-10);
  close(trap(r.t,r.c)+recirculationTailAUC(e,6,fb,fr),100/(6*(1-fb*fr)),.0001*100/(6*(1-fb*fr)));
  if(fr===0)close(trap(r.t,r.c)+recirculationTailAUC(e,6,fb,fr),100/6,.001);
 }
});

test('Cockcroft–Gault and the impairment multiplier preserve units, sex factor and mean-dose algebra',()=>{
 const m=renalScaling(70,70,2.4,false,.8),f=renalScaling(70,70,2.4,true,.8);close(m.creatinineClearance,4900/172.8);close(f.creatinineClearance/m.creatinineClearance,.85);
 const low=renalScaling(90,40,6,true,1);assert.ok(low.creatinineClearance<5);assert.ok(low.kidneyFraction<.04);close(low.clearanceFraction,low.kidneyFraction);
 const high=renalScaling(20,120,.5,false,.8);close(high.kidneyFraction,1);close(high.clearanceFraction,1);
 for(const v of [m,f,low,high]){const D=200,CL=4,tau=8,Q=v.clearanceFraction;close((D*Q)/(CL*Q*tau),D/(CL*tau));close(D/(CL*Q*(tau/Q)),D/(CL*tau));}
});

const {hepaticModel}=await import('../content/pharm/liver.shared.js');
test('both hepatic models use their own exact elasticities, including parallel-tube limits',()=>{
 for(const model of ['ws','pt'])for(const Q of [20,90,300])for(const capacity of [.01,30,20000]){const m=hepaticModel(Q,capacity,model),eps=1e-5,eQ=(Math.log(hepaticModel(Q*Math.exp(eps),capacity,model).clearance)-Math.log(hepaticModel(Q*Math.exp(-eps),capacity,model).clearance))/(2*eps),eC=(Math.log(hepaticModel(Q,capacity*Math.exp(eps),model).clearance)-Math.log(hepaticModel(Q,capacity*Math.exp(-eps),model).clearance))/(2*eps);close(m.flowElasticity+m.capacityElasticity,1);close(eQ,m.flowElasticity,1e-8);close(eC,m.capacityElasticity,1e-8);assert.ok(m.clearance<=Q&&m.clearance<=capacity);}
 const pt=hepaticModel(90,90,'pt');assert.ok(Math.abs(pt.flowElasticity-pt.extraction)>.1);
});

test('exact infusion metrics agree with independently sampled concentration curves and daily exposure',()=>{
 for(const half of [1.5,2.5,12])for(const interval of [8,12,24])for(const mic of [.25,1,8]){const m=infusionRegimen(350,17.5,half,interval,.5,mic),k=Math.LN2/half,f=t=>cSS(t,interval,m.dose,17.5,k,Infinity,.5);close(f(.5),m.peak,1e-8);close(f(interval),m.trough,1e-8);close(meanOver(f,0,interval,4800)*24,m.dailyAUC,.0001);let below=0;for(let i=0;i<4800;i++)if(f(interval*(i+.5)/4800)<mic)below++;close(below/4800*24,m.hoursBelow,.011);}
 const slow=infusionRegimen(350,17.5,12,24,.5,1).peak/infusionRegimen(350,17.5,12,8,.5,1).peak;assert.ok(slow>1.4&&slow<1.5);
});

test('context-sensitive half times match independently integrated post-infusion mass equations',()=>{
 for(const drug of [ANAES.fentanyl,ANAES.propofol,ANAES.thiopental])for(const T of [1,120,480]){const m=mamm(drug),half=cshtHold(m,T,20000),C=[1,...m.Q.map((q,i)=>-Math.expm1(-q*T/m.V[i+1]))],F=y=>{const rates=y.slice(1).map((c,i)=>m.Q[i]*(y[0]-c));return [(-m.CL*y[0]-rates.reduce((a,b)=>a+b,0))/m.V[0],...rates.map((r,i)=>r/m.V[i+1])];};let state=C;const N=Math.ceil(half/.01),h=half/N;for(let i=0;i<N;i++)state=rk4(F,state,i*h,h);close(state[0],.5,1e-10);const rateHalf=cshtRate(m,T,20000);assert.ok(Number.isFinite(rateHalf)&&rateHalf>0);}
});

test('redistribution conserves the given dose and marks the final downward crossing after the final bolus',async()=>{
 const{simulateRedistribution,lastDownwardCrossing}=await import('../content/pharm/redistribution.shared.js');
 for(const second of[false,true])for(const CL of[0,.2])for(const Q2 of[0,1]){const s=simulateRedistribution({second,CL,Q2});for(let i=0;i<s.t.length;i+=17)close(s.a1[i]+s.a2[i]+s.a3[i]+s.el[i],300*(second&&s.t[i]>=30?2:1),2e-9);const pk=Math.max(...s.ce.filter((_,i)=>s.t[i]<30)),thr=.3*pk,t=lastDownwardCrossing(s.t,s.ce,thr,second?30:0);assert.ok(!Number.isFinite(t)||t>(second?30:0));if(Number.isFinite(t)){const i=s.t.findIndex(x=>x>=t);assert.ok(s.ce[i]<=thr&&s.ce[i-1]>thr);}}
 close(lastDownwardCrossing([0,1,2,3,4,5],[0,2,0,0,2,0],1,3),4.5);assert.ok(Number.isNaN(lastDownwardCrossing([0,1,2],[0,2,0],1,2)));
});

test('PBPK capacity/conductance formulation agrees with independent organ mass fluxes',()=>{
 const volumes=[1.4,1.8,28,14,18],flows=[.7,1.5,1,.3,2.5];for(const kp of[[3,4,2,25,2],[1,2,1,4,1],[.15,.8,.4,.2,.6]])for(const co of[.5,1.5])for(const ci of[.02,5]){const z=[2,.4,1.1,.7,.3,.8],W=[5,...volumes.map((x,i)=>x*kp[i])];const Q=flows.map(x=>co*x),G=Array.from({length:6},()=>Array(6).fill(0));G[0][0]=-Q.reduce((a,b)=>a+b,0);for(let i=0;i<5;i++){G[0][i+1]=G[i+1][0]=Q[i];G[i+1][i+1]=-Q[i]-(i===1?ci:0);}const actual=pbpkSystem(kp,co,ci),dz=actual.field(z);for(let i=0;i<6;i++)close(actual.W[i],W[i]);for(let i=0;i<5;i++)close(dz[i+1]*W[i+1],Q[i]*(z[0]-z[i+1])-(i===1?ci*z[2]:0));close(dz.reduce((s,x,i)=>s+x*W[i],0),-ci*z[2]);const vals=actual.M;for(let i=0;i<6;i++)for(let j=0;j<6;j++)close(vals[i][j],vals[j][i]);}
});
