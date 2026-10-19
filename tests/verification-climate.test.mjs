import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latitudeResponse, moistProfile, GRID, tropicalAmp, polarAmp, cloudOLR, tAtP, pAtT, AR6, LAM0, SIG } from '../content/climate/ch04.shared.js';

const near = (a, b, tol) => assert.ok(Math.abs(a-b) < tol, `${a} vs ${b}, tolerance ${tol}`);

test('AR6 Table 7.10 central terms close to the assessed restoring and amplification', () => {
  const nonPlanck = AR6.wvlr + AR6.albedo + AR6.cloud + AR6.other;
  near(AR6.planck + nonPlanck, -1.16, 1e-12);
  near(1/(1-nonPlanck/LAM0), 2.7758620689655173, 1e-12);
  near(LAM0/(LAM0-AR6.wv), 2.220689655172414, 1e-12);
});

test('the moist adiabat has the dry Poisson limit at low humidity', () => {
  // Independent dry-air solution of d ln T / d ln p=Rd/cp.
  const p=[1000,850,700,500], dry=moistProfile(180,p);
  p.forEach((x,i)=>near(dry[i],180*(x/1000)**(287/1004),.002));
  const tropical=tropicalAmp(295), polar=polarAmp();
  assert.ok(tropical.some((x,i)=>GRID.pm[i]>130 && GRID.pm[i]<400 && x>1.5));
  GRID.pm.forEach((p,i)=>{if(p<=70){near(tropical[i],1,1e-12);near(polar[i],1,1e-12);}});
});

test('latitude solver preserves uniform warming and global energy for variable feedbacks', () => {
  for(const D of [0,.02,.2,1.5]) {
    const u=latitudeResponse(Array(90).fill(1.16),D,3.93);
    assert.equal(u.stable,true);
    u.dT.forEach(t=>near(t,3.93/1.16,1e-10)); near(u.ratio,1,1e-12);
    const lam=Array.from({length:90},(_,i)=>.5+((i+.5)/90)**2);
    const r=latitudeResponse(lam,D,3.93);
    near(lam.reduce((s,l,i)=>s+l*r.dT[i],0)/90,3.93,1e-10);
  }
});

test('finite-volume latitude solver converges to an independently manufactured spherical solution', () => {
  // Exact T=2+x², D=.1, F=1: D[(1-x²)T′]′=.2-.6x².
  const error=n=>{
    const lam=Array.from({length:n},(_,i)=>{const x=(i+.5)/n;return (1.2-.6*x*x)/(2+x*x);});
    const r=latitudeResponse(lam,.1,1);
    return Math.max(...r.dT.map((t,i)=>Math.abs(t-2-((i+.5)/n)**2)));
  };
  const a=error(45), b=error(90), c=error(180);
  assert.ok(b<a/3.8 && c<b/3.8); assert.ok(c<1e-5);
});

test('unstable algebraic latitude solutions are excluded, even if diffusion smooths them', () => {
  for(const D of [0,.02,.2,1.5]) {
    const r=latitudeResponse(Array(90).fill(-1),D,4);
    assert.equal(r.stable,false); assert.equal(r.dT,null); assert.equal(r.ratio,null);
  }
  const lam=Array.from({length:90},(_,i)=>i>85?-.2:1);
  assert.equal(latitudeResponse(lam,0,4).stable,false);
  assert.equal(latitudeResponse(lam,.2,4).stable,true);
});

test('grey cloud mixing has the clear-sky and opaque isothermal limits', () => {
  const T=GRID.pm.map(()=>260), q=GRID.pm.map(()=>4e-6);
  const clear=cloudOLR(T,260,280,q,250,.8,0);
  const all=cloudOLR(T,260,280,q,250,.8,1);
  near(clear.all,clear.clear,1e-12);
  // Every emitting layer and the boundary share one source function; clouds cannot change OLR.
  near(all.all,all.clear,1e-10);
  const mixed=cloudOLR(T,290,280,q,250,.8,.3);
  near(mixed.all,.7*mixed.clear+.3*mixed.cloudy,1e-12);
});

test('fixed cloud temperature is recovered by logarithmic pressure interpolation', () => {
  const T=GRID.pm.map(p=>220+10*Math.log(p/100));
  for(const p of [200,250,900]) {const target=tAtP(T,p);near(pAtT(T,target),p,1e-10);}
});

test('radiative kernels close against independent whole-column perturbations with quadratic residual', async () => {
  const { columnKernels, humidity, lw }=await import('../content/climate/ch04.shared.js');
  const T=GRID.pm.map(p=>Math.max(220,290*(p/1000)**.15)), c={T,Ts:290,q:humidity(T)};
  const K=columnKernels(c);
  const error=d=>{
    const dt=T.map((_,i)=>d*(1+.3*Math.sin(i))), dq=T.map((_,i)=>d*.06*(1+.2*Math.cos(i)));
    const changed=T.map((t,i)=>t+dt[i]), q=c.q.map((x,i)=>x*Math.exp(dq[i]));
    const linear=-(K.KTs*d+K.KT.reduce((s,k,i)=>s+k*dt[i],0)+K.KQ.reduce((s,k,i)=>s+k*dq[i],0));
    const direct=-(lw(changed,c.Ts+d,280,q).olr-K.base);
    return Math.abs(linear-direct);
  };
  const a=error(.4), b=error(.2), small=error(.02);
  assert.ok(b<a/3,'halving the multivariable change reduces the linearization residual quadratically');
  assert.ok(small<.001);
});

test('Fourier explanatory hot box conserves energy with transmitted IR and transparent limits', async () => {
  const { solveBox }=await import('../content/climate/ch02-d.js');
  for(const n of [0,1,3,5]) for(const eps of [0,.2,1]) for(const hc of [0,3]) {
    const Ta=293, S=1000*.95*.9**n, T=solveBox(n,1000,eps,hc,3);
    T.forEach(t=>assert.ok(Number.isFinite(t)));
    let up=SIG*T[0]**4;
    for(let k=1;k<=n;k++)up=(1-eps)*up+eps*SIG*T[k]**4;
    near(S+SIG*Ta**4-up-3*(T[0]-Ta)-10*(T[n]-Ta),0,1e-5);
  }
  for(const n of [0,1,3,5]) {
    const S=1000*.95*.9**n, T=solveBox(n,1000,1,0,0,{hout:0});
    for(let k=0;k<=n;k++)near(T[k],(293**4+(n+1-k)*S/SIG)**.25,1e-7);
    const transparent=solveBox(n,1000,0,0,0,{hout:0});
    near(transparent[0],(293**4+S/SIG)**.25,1e-7);
  }
});

test('short forcing response agrees with the independent one-box exponential convolution', async () => {
  const { twoBox }=await import('../content/climate/ch03.shared.js');
  // For gamma=0 and F=-3 exp(-t), T=-3/C*(exp(-t)-exp(-lambda*t/C))/(lambda/C-1).
  for(const lam of [.7,2]) for(const C of [3,20]) {
    const r=twoBox(t=>-3*Math.exp(-t),lam,{C,gam:0},6,.025);
    for(const t of [.5,1,2,6])near(r.T[Math.round(t/.025)],-3/C*(Math.exp(-t)-Math.exp(-lam*t/C))/(lam/C-1),1e-8);
  }
});

test('photon slab reports unfinished paths rather than counting them as transmission', async () => {
  const { cloudPhotonAlbedo }=await import('../content/climate/ch03-b.js');
  const { rng }=await import('../assets/js/viz/math.js');
  assert.deepEqual(cloudPhotonAlbedo(0,rng(4),500),[0,0,0]);
  const thin=cloudPhotonAlbedo(1,rng(4),3000), thick=cloudPhotonAlbedo(30,rng(4),3000);
  assert.equal(thin[2],0);assert.equal(thick[2],0);
  assert.ok(thick[0]>thin[0]+5*Math.hypot(thin[1],thick[1]));
  assert.ok(cloudPhotonAlbedo(100,rng(4),500,.85,1)[2]>0);
});
