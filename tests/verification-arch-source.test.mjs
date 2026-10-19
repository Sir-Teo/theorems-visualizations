import test from 'node:test';
import assert from 'node:assert/strict';
import { discreteRingTension, continuumRingTension, wholeDomeWeight, capProfile, pinnaclePier, groinHeight } from '../content/arch/assessment.shared.js';
import { arch, bestFit, thrustRange } from '../content/arch/ch03.shared.js';
import { domeSlice, sphereMid, crossVault, profile, membrane } from '../content/arch/ch04.shared.js';
const close=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('groin vault opens at the edge arches and its surface weight matches the primary formula',()=>{
  const R=3,w=.3*22;
  close(groinHeight(R,0,0),R);close(groinHeight(R,R,0),R);close(groinHeight(R,R,R),0);
  close(groinHeight(R,.8*R,.6*R),.8*R);
  const q=crossVault(R,.3,22,1600);
  close(q.Wgroin,4*(Math.PI-2)*w*R*R,.003);
  close(q.Wbarrel,2*Math.PI*w*R*R);
  close(q.Hd,2*Math.SQRT2*w*R*R*(3*Math.PI/8-1),.0001);
  assert.ok(q.q(0)<q.q(R));
});
test('barrel crown moment uses lever arms measured from the springing',()=>{
  const R=3,w=6.6,n=10000,h=Math.PI/(2*n);let moment=0;
  for(let i=0;i<n;i++){const theta=(i+.5)*h;moment+=w*R*(R-R*Math.sin(theta))*h;}
  close(crossVault(R,.3,22).Hbarrel,moment/R,1e-7);
});
test('diametral dome weights count two gores and recover a full shell independently',()=>{
  const R=3,t=.1,gamma=22,expected=gamma*2*Math.PI/3*((R+t/2)**3-(R-t/2)**3);
  const totals=[];
  for(const gores of [16,50,64]){
    const g=domeSlice(sphereMid(R,90,160),t,{gamma,dtheta:2*Math.PI/gores});
    totals.push(wholeDomeWeight(g.W,gores));close(totals.at(-1),expected,.02);
  }
  close(totals[0],totals[1],1e-10);close(totals[1],totals[2],1e-10);
});
test('discrete hoop forces balance each radial gore and approach the continuum result',()=>{
  for(const n of [16,50,64]){const H=120,T=discreteRingTension(H,n);close(2*T*Math.sin(Math.PI/n),H);assert.ok(T>continuumRingTension(H,n));}
  assert.ok(discreteRingTension(120,64)/continuumRingTension(120,64)-1<.0005);
});
test('spherical caps meet their base ring even when rise exceeds the hemisphere',()=>{
  for(const h of [.2,.35,1,1.2]){const base=1,R=(base*base+h*h)/(2*h),centre=h-R,p=capProfile(base,h,64);close(p[0][0],0);close(p[0][1],h);close(p.at(-1)[0],base);close(p.at(-1)[1],0);for(const [r,z]of p)close(r*r+(z-centre)**2,R*R,1e-12);}
});
test('pinnacle threshold is the exact toe-moment boundary over the whole pier',()=>{
  for(const H of [10,60,120])for(const width of [.8,1.5,3]){
    const m=pinnaclePier(H,width,0),q=pinnaclePier(H,width,m.need);
    let sampled=Infinity;for(let k=0;k<=1000;k++)sampled=Math.min(sampled,q.xo-q.X(10.2*k/1000));close(sampled,q.worst,1e-10);assert.ok(q.worst>=-1e-9);
    if(m.need>1){assert.ok(pinnaclePier(H,width,m.need-1).worst<0);close(q.worst,0,1e-10);}
  }
});
test('semicircular minimum thickness converges within the stated source-table tolerance',()=>{
  const values=[20,40,80].map(N=>bestFit(t=>arch({R:1,t,N,alpha:Math.PI/2}),()=>[],{},.05,.2,24).t);
  close(values[1],.10748,3e-5);assert.ok(Math.abs(values[2]-values[1])<Math.abs(values[1]-values[0]));
  assert.equal(thrustRange(arch({R:1,t:values[1]-.001,N:40}),[]),null);assert.ok(thrustRange(arch({R:1,t:values[1]+.001,N:40}),[]));
});
test('membrane reconstruction agrees with the independent spherical closed form',()=>{
  const R=3,w=7,P=profile({type:'sphere',R,phi1:90,n:1200}),m=membrane(P,w);
  for(const i of [200,500,900,1200]){const c=Math.cos(P[i].psi);close(m.Nphi[i],-w*R/(1+c),2e-5);close(m.Ntheta[i],w*R*(1/(1+c)-c),2e-5);}
});
