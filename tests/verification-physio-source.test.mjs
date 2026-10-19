import { poiseuille, pulseSpeed, reflectedDelay } from '../content/physio/vessel-flow.shared.js';
import { wall, hvec, proj } from '../content/physio/cardiac-observables.shared.js';
import { harveyOutput, harveyVeinFilled } from '../content/physio/harvey.shared.js';
import test from 'node:test';import assert from 'node:assert/strict';
import { vesselVolume, pressureForVolume, vesselCompliance } from '../content/physio/compliance.shared.js';
import { windkessel, womersleyU, womersleyCentre } from '../content/physio/ch04.shared.js';
import { heartBeat } from '../content/physio/ch03.shared.js';
const close=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('saturating vascular compliance has an exact inverse and a finite volume capacity',()=>{
 for(const m of [{Vu:500,C0:2.2,pinf:250},{Vu:2800,C0:110,pinf:25}]){
  for(const P of [0,2,10,100,120]){const V=vesselVolume(m,P);close(pressureForVolume(m,V),P,1e-10);const h=.001;close((vesselVolume(m,P+h)-vesselVolume(m,P-h))/(2*h),vesselCompliance(m,P),1e-7);}
  assert.equal(pressureForVolume(m,m.Vu+m.C0*m.pinf),Infinity);assert.equal(pressureForVolume(m,m.Vu+m.C0*m.pinf+1),Infinity);
 }
 const artery={Vu:500,C0:2.2,pinf:250};assert.equal(pressureForVolume(artery,vesselVolume(artery,120)+500),Infinity);
});
test('cardiac output and ejection fraction reconcile with integrated flow and chamber volumes',()=>{
 for(const HR of [40,75,130]){const r=heartBeat({HR});close(r.SV,r.EDV-r.ESV,.1);close(r.EF,r.SV/r.EDV,1e-10);assert.ok(r.SV>0&&r.EF>0&&r.EF<1);}
});

test('Windkessel starts at the periodic solution even when RC exceeds the simulated duration',()=>{
 for(const R of [.3,1.05,3])for(const C of [.3,1.5,5])for(const HR of [40,75,130]){
  const v=windkessel({R,C,HR,beats:1,Pv:5,SV:70});
  close(v.Pw[0],v.Pw.at(-1),.003);close(v.Pm,5+R*70*HR/60,.01);
  const i=v.t.findIndex(t=>t>v.Ts+.02),j=v.t.length-1;
  close((v.Pw[j]-5)/(v.Pw[i]-5),Math.exp(-(v.t[j]-v.t[i])/(R*C)),2e-8);
 }
});

test('three-element Windkessel includes characteristic impedance in its mean inlet pressure',()=>{
 for(const Zc of [0,.04,.15]){const r=windkessel({R:1.8,C:3,Zc,beats:1});close(r.Pm,(1.8+Zc)*r.Qmean,.01);}
});

test('Harvey weight arithmetic agrees with the original Chapter IX examples',()=>{
 const a=harveyOutput(1,1000);close(a.ounces,125);close(a.pounds,10+5/12);
 close(harveyOutput(4,1000).pounds,41+8/12);close(harveyOutput(8,1000).pounds,83+4/12);
 close(harveyOutput(4,2500).pounds,104+2/12);
});
test('Harvey valve sequence leaves the heart-side segment filled during the failed backward stroke',()=>{
 assert.equal(harveyVeinFilled(1,3,.5),true);assert.equal(harveyVeinFilled(2,3,1),false);
 assert.equal(harveyVeinFilled(3,3,.5),false);assert.equal(harveyVeinFilled(3,6,.5),true);
 assert.equal(harveyVeinFilled(4,3,0),false);assert.equal(harveyVeinFilled(4,3,1),true);
});

test('Womersley profiles satisfy the independently discretized momentum PDE and no-slip boundary',()=>{
 const hs=1e-4,hp=1e-5;
 for(const al of [.1,1,5,20])for(const r of [.2,.5,.8])for(const p of [0,.7,2.1]){
  const u=womersleyU(al,r,p),up=womersleyU(al,r+hs,p),um=womersleyU(al,r-hs,p);
  const dt=(womersleyU(al,r,p+hp)-womersleyU(al,r,p-hp))/(2*hp);
  close(al*al*dt,4*Math.cos(p)+(up-2*u+um)/(hs*hs)+(up-um)/(2*hs*r),.002);
  close(womersleyU(al,1,p),0,1e-10);
 }
 for(const r of [0,.2,.5,.8,1])close(womersleyU(.01,r,.7),(1-r*r)*Math.cos(.7),.00002);
 const c=womersleyCentre(20);close(c[0],0,1e-6);close(c[1],-.01,1e-6);
 const c6=womersleyCentre(6);assert.ok(-Math.atan2(c6[1],c6[0])*180/Math.PI>92);
});

test('sphere geometry conserves wall volume; ECG projections obey potential-difference lead identity',()=>{
 for(const V of [10,50,100,250])for(const W of [80,150,320]){const g=wall(V,W);close(4*Math.PI*(g.ro**3-g.ri**3)/3,W,1e-9);close(4*Math.PI*g.ri**3/3,V,1e-9);assert.ok(g.h>0);}
 for(const rot of [-120,-30,0,45,90])for(let t=0;t<.8;t+=.007){const h=hvec(t,rot);close(proj(h,0)+proj(h,120),proj(h,60),1e-12);}
});

test('tube flow satisfies force balance, integrated flux and regime diagnostics; pulse delays use round-trip distance',()=>{
 for(const [r,L,mu,P]of[[.0015,.1,.0035,266.644],[.003,.01,.001,6666.1],[.0002,.2,.008,133.322]]){const m=poiseuille(r,L,mu,P);let q=0;const n=10000,dr=r/n;for(let i=0;i<n;i++){const x=(i+.5)*dr;q+=m.velocity(x)*2*Math.PI*x*dr;}close(q/m.flow,1,1e-8);close(2*Math.PI*r*L*m.shear,Math.PI*r*r*P,1e-12);close(m.mean,m.flow/(Math.PI*r*r),1e-10);close(poiseuille(2*r,L,mu,P).flow/m.flow,16);}
 assert.ok(poiseuille(.003,.01,.001,6666.1).reynolds>1e6);
 close(pulseSpeed(2e6)/pulseSpeed(.5e6),2);close(reflectedDelay(.6,.05,5),.22);close(reflectedDelay(.6,.55,5),.02);
});

test('toy twitch kinetics remain bounded and slower removal fuses at lower stimulus rates',async()=>{
 const{TW,twitchRun,windowStats}=await import('../content/physio/twitch.shared.js');for(const kind of['fast','slow'])for(const f of[1,10,40,100]){const s=twitchRun(f,TW[kind]);assert.ok(s.c.every(x=>x>=0&&x<=1));assert.ok(s.F.every(x=>x>=0&&Number.isFinite(x)));assert.ok(s.stim.length>=1);}const ratio=k=>{const x=windowStats(twitchRun(20,TW[k]),20);return x.min/x.max;};assert.ok(ratio('slow')>ratio('fast'));
});
test('loaded-heart event ordering and beat flow/volume balance hold over reviewed control ranges',async()=>{
 const{heartBeat}=await import('../content/physio/ch03.shared.js');for(const HR of[50,75,120]){const r=heartBeat({HR});assert.ok(r.tMVC<r.tAVO&&r.tAVO<r.tAVC&&r.tAVC<r.tMVO);const integ=y=>y.slice(1).reduce((s,v,i)=>s+(v+y[i])*(r.t[i+1]-r.t[i])/2,0);assert.ok(Math.abs(integ(r.Q)-r.SV)<.08);assert.ok(Math.abs(integ(r.Qm)-integ(r.Q))<.12);assert.ok(Math.abs(r.V.at(-1)-r.V[0])<.02);}for(const R of[.7,2.6]){const lo=heartBeat({Pv:2,R}),hi=heartBeat({Pv:26,R});assert.ok(hi.CO>lo.CO&&hi.EDV>lo.EDV);}
});
test('oedema model has normal balance and an eventual finite equilibrium, even beyond its plotted window',async()=>{
 const{oedemaFlows}=await import('../content/physio/circulation-review.shared.js');const normal=oedemaFlows();assert.ok(Math.abs(normal.Jf(0)-normal.Jl(0))<1e-12);for(const dv of[0,13,30])for(const pc of[8,28])for(const ly of[0,1])for(const sg of[.4,1]){const{Jf,Jl}=oedemaFlows(dv,pc,ly,sg);assert.ok(Jf(2000)-Jl(2000)<0);let prev=Jf(0)-Jl(0);for(let x=.1;x<=30;x+=.1){const now=Jf(x)-Jl(x);assert.ok(now<prev);prev=now;}}});
test('myogenic gain matches its logarithmic definition and venous-return equilibria respect collapse and nonnegative flow',async()=>{
 const{myogenicModel,returnEquilibrium,cardiacOutput,venousReturn}=await import('../content/physio/circulation-review.shared.js');for(const g of[0,.5,1]){const m=myogenicModel(g,1.4);const gain=1-Math.log(m.qr(140)/m.qr(80))/Math.log(m.qp(140)/m.qp(80));assert.ok(Math.abs(gain-g)<1e-12);}for(const pm of[-8,-2,7,26])for(const c of[.2,2.24])for(const r of[.68,3]){const e=returnEquilibrium(c,pm,r);assert.ok(e.Q>=0);assert.ok(Math.abs(e.Q-venousReturn(e.P,pm,r))<1e-10);assert.ok(Math.abs(e.Q-cardiacOutput(e.P,c))<1e-10);if(pm<=-2)assert.ok(e.stopped);}});
test('stenosis SI conversion includes the proximal kinetic term and recovery bounds',async()=>{
 const{RHO_BLOOD,PA_PER_MMHG}=await import('../content/physio/ch04.shared.js');for(const pct of[0,75,90])for(const Q of[50,500]){const a=Math.PI*1.2**2,v1=Q/a/100,v2=Q/(a*(1-pct/100))/100,dp=.5*RHO_BLOOD*(v2*v2-v1*v1)/PA_PER_MMHG;assert.ok(dp>=0);assert.ok(Math.abs((4*v2*v2-dp)-(4*v1*v1+(4-.5*RHO_BLOOD/PA_PER_MMHG)*(v2*v2-v1*v1)))<1e-10);for(const rec of[0,.6,1])assert.ok(dp*(1-rec)>=0&&dp*(1-rec)<=dp);}});
