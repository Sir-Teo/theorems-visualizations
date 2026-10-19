import test from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{periodicWindkessel,pulseShape,pulsePeak,waveSpeed}from'../content/physio/physio-source-audit-dynamics.js';
import{womersleyU,womersleyCentre}from'../content/physio/ch04.shared.js';
const close=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function simpson(f,a,b,n=2000){const h=(b-a)/n;let s=f(a)+f(b);for(let j=1;j<n;j++)s+=(j%2?4:2)*f(a+j*h);return s*h/3;}
test('Periodic Windkessel: independent RK4 one-cycle trajectory and closure at all16 R/C/HR/Zc corners',()=>{
 for(const R of[.4,2])for(const C of[.2,8])for(const HR of[50,130])for(const Zc of[0,.15]){
  const W=periodicWindkessel({R,C,HR,Zc}),T=60/HR,Ts=.35*T,pk=70*Math.PI/(2*Ts),q=t=>t>0&&t<Ts?pk*Math.sin(Math.PI*t/Ts):0,f=(t,p)=>(q(t)-p/R)/C;
  let p=W.P0,t=0;for(const end of[Ts,T]){const h=(end-t)/5000;for(let k=0;k<5000;k++){const k1=f(t,p),k2=f(t+h/2,p+h*k1/2),k3=f(t+h/2,p+h*k2/2),k4=f(t+h,p+h*k3);p+=h*(k1+2*k2+2*k3+k4)/6;t+=h;if(k%500===0)close(p,W.chamberAt(t),3e-9);}close(p,W.chamberAt(end),3e-9);}close(p,W.P0,3e-9);
  close(W.Pes*Math.exp(-(T-Ts)/(R*C)),W.P0);assert.equal(W.t.filter(t=>t===Ts).length,1);
 }
});
test('Periodic Windkessel: independently integrated mean pressure, inflow/outflow volume and constant-Pv offset',()=>{
 for(const R of[.4,2])for(const C of[.2,8])for(const HR of[50,130])for(const Zc of[0,.15]){const W=periodicWindkessel({R,C,HR,Zc}),I=f=>simpson(f,0,W.Ts)+simpson(f,W.Ts,W.T);close(I(W.flowAt),70);close(I(t=>W.chamberAt(t)/R),70);close(I(W.pressureAt)/W.T,W.Pm);close(W.Pm,(R+Zc)*70/W.T);}
 const A=periodicWindkessel({Pv:8}),B=periodicWindkessel({Pv:0});for(const t of[0,.1,.28,.4,.8])close(A.pressureAt(t)-B.pressureAt(t),8);
});
test('Windkessel extrema bound dense independent observations and minimum differs from end-cycle pressure',()=>{
 for(const R of[.4,2])for(const C of[.2,8])for(const Zc of[0,.15]){const W=periodicWindkessel({R,C,Zc});let lo=Infinity,hi=-Infinity;for(let j=0;j<=10000;j++){const p=W.pressureAt(W.T*j/10000);lo=Math.min(lo,p);hi=Math.max(hi,p);}assert.ok(W.Pd<=lo+1e-9&&W.Ps>=hi-1e-9);close(W.Pd,lo,2e-6);close(W.Ps,hi,2e-6);}
 const W=periodicWindkessel();assert.ok(W.Pd<W.P0);const A=periodicWindkessel({Zc:0}),B=periodicWindkessel({Zc:.15});close(B.Pm-A.Pm,.15*70/.8);assert.deepEqual(A.P,A.Pw);
});
test('Reflected pulse: analytic piecewise extrema agree with dense sampling including separated and coincident pulses',()=>{
 for(const d of[0,.001,.03,.1,.15,.25,.3,.4,.6])for(const G of[0,.25,.6,1]){const p=pulsePeak(d,G);let max=0;for(let j=0;j<=20000;j++){const t=(d+.3)*j/20000;max=Math.max(max,pulseShape(t)+G*pulseShape(t-d));}close(p.value,max,1e-7);close(pulseShape(p.time)+G*pulseShape(p.time-d),p.value);assert.ok(p.value>=1-1e-12&&p.value<=1+G+1e-12);if(d>=.3)close(p.value,1);if(d===0)close(p.value,1+G);}
});
test('Thin-wall speed: dimensional derivation, stiffness scaling, true model range and round-trip delay',()=>{
 const rho=1060;for(const E of[.2,2.5])for(const d of[.004,.024]){const h=.05*d,A=Math.PI*d*d/4,dAdP=A*d/(E*1e6*h);close(waveSpeed(E),Math.sqrt(A/(rho*dAdP)));}close(waveSpeed(.8)/waveSpeed(.2),2);assert.ok(waveSpeed(.2)>3&&waveSpeed(.2)<3.1);assert.ok(waveSpeed(2.5)>10.8&&waveSpeed(2.5)<10.9);for(const l of[.2,.9])for(const site of[0,l-.01])assert.ok(2*(l-site)/waveSpeed(.2)>0);
});
test('Womersley implementation:160 independent80-digit mpmath Bessel references at8 alpha values and5 radii×4 phases',async()=>{
 const F=JSON.parse(await readFile(new URL('./fixtures/physio-source-womersley.json',import.meta.url)));assert.equal(F.samples.length,160);for(const {alpha,r,phase,u}of F.samples)close(womersleyU(alpha,r,phase),u,2e-10);
});
test('Womersley: no slip, low-alpha limit and centre-line lag overshoot distinguish it from the volume-flow phase',()=>{
 for(const a of[.01,.1,1,4.6,7,20])for(const p of[0,.2,Math.PI/2])close(womersleyU(a,1,p),0);
 for(const r of[0,.3,.9])close(womersleyU(.01,r,0),1-r*r,1e-8);
 const c=womersleyCentre(7),lag=-Math.atan2(c[1],c[0])*180/Math.PI;assert.ok(lag>92&&lag<93);
 const low=womersleyCentre(.01),high=womersleyCentre(20);assert.ok(Math.hypot(...low)>.99999);assert.ok(Math.hypot(...high)<.011);
});
test('Scoped chapter integration preserves all prior dependency arrays and adjacent4.8 verification status',async()=>{
 const b=(await import('../content/physio/ch04-b.js')).default.items,c=(await import('../content/physio/ch04-c.js')).default.items;
 for(const [items,num,deps]of[[b,'4.7',['physio-4.1','physio-4.6','em-6.12']],[b,'4.8',['physio-4.7']],[b,'4.9',['physio-4.6']],[c,'4.15',['physio-4.2']]])assert.deepEqual(items.find(x=>x.num===num).deps,deps);
 assert.equal(b.find(x=>x.num==='4.8').verify,undefined);
});
