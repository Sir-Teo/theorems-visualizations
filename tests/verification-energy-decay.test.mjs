import test from 'node:test';
import assert from 'node:assert/strict';
import {decayFractionAudit as fraction,decayIntegralAudit as integral,decayWaterAudit as water} from '../content/energy/source-audit-decay.shared.js';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1e-12,Math.abs(b)),`${a} != ${b}`);
const original=(t,T)=>.1*((t+10)**-.2-.87*(t+2e7)**-.2-(t+T+10)**-.2+.87*(t+T+2e7)**-.2);
const quad=(a,b,T)=>{const N=2048,h=Math.log(b/a)/N;let sum=0;for(let i=0;i<=N;i++){const t=a*Math.exp(h*i);sum+=(i===0||i===N?1:i%2?4:2)*original(t,T)*t;}return sum*h/3;};
test('original Eq2 coefficients and finite-irradiation difference are transcribed exactly',()=>{
  for(const t of [10,100,3600,86400,8.64e6])for(const T of [10*86400,365*86400,1500*86400])close(fraction(t,T),original(t,T),2e-12);
  close(fraction(3600,365*86400),.01574725505724175);
  close(fraction(86400,365*86400),.006615892648793842);
});
test('instantaneous-irradiation limit has the scale of original Appendix II summation values',()=>{
  // Original p20: magnitude of fractional-heat derivative, per second.
  // The empirical fit is intentionally approximate; report p4 says it is
  // about 22% higher than the nuclide summation, rather than identical data.
  const table=[[8.64e4,2.12e-8],[2.16e5,7.57e-9],[4.32e5,3.22e-9],[8.64e5,1.18e-9],[2.16e6,3.44e-10],[4.32e6,1.49e-10],[8.64e6,5.88e-11]];
  for(const[t,rate]of table){const fromShortIrradiation=fraction(t,.01)/.01;assert.ok(fromShortIrradiation/rate>.8&&fromShortIrradiation/rate<1.4);}
});
test('closed heat integral agrees with independent numerical integration and additive intervals',()=>{
  for(const t0 of [10,3600,8.64e6])for(const T of [10*86400,1500*86400])for(const dt of [100,360000]){
    close(integral(t0,t0+dt,T),quad(t0,t0+dt,T),3e-8);
    close(integral(t0,t0+dt,T),integral(t0,t0+dt/3,T)+integral(t0+dt/3,t0+dt,T),1e-8);
  }
  assert.equal(integral(10,10,86400),0);
});
test('longer irradiation raises heat, while elapsed time lowers it throughout the displayed range',()=>{
  for(const T of [10*86400,1500*86400]){let prior=Infinity;for(let j=0;j<=100;j++){const t=10*(864000**(j/100)),q=fraction(t,T);assert.ok(q>0&&q<=prior);prior=q;assert.ok(fraction(t,2*T)>q);}}
});
test('water warms at fixed mass before latent evaporation; exhaustion and horizon are distinct',()=>{
  for(const t0 of [10,3600,8.64e6])for(let mask=0;mask<8;mask++){
    const p={t0,T:(mask&1?1500:10)*86400,powerMW:mask&2?4000:100,massKg:(mask&4?600:20)*1000,latent:2256.47e3},w=water(p);
    let previous=100;for(const[h,percent]of w.points){assert.ok(h>=0&&h<=100&&percent>=0&&percent<=100&&percent<=previous+1e-10);previous=percent;if(w.boilTime===null||h*3600<w.boilTime-1e-4)close(percent,100,1e-9);}
    if(w.boilTime!==null)close(p.powerMW*1e6*quad(t0,t0+w.boilTime,p.T),p.massKg*4186*60,1e-7);
    if(w.dryTime!==null){assert.equal(w.left,0);close(w.energy,p.massKg*(4186*60+p.latent),1e-7);close(w.endTime,w.dryTime);}
    else{assert.equal(w.endTime,360000);assert.ok(w.left>0);close(w.left,p.massKg-Math.max(0,w.energy-w.sensible)/p.latent);}
  }
  const cool=water({t0:8.64e6,T:864000,powerMW:100,massKg:600000,latent:2256.47e3});assert.equal(cool.boilTime,null);assert.equal(cool.dryTime,null);assert.equal(cool.left,600000);
});
