import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../content/stoch/ch05.shared.js';
const near = (x,y,t=2e-11) => assert.ok(Math.abs(x-y)<=t,`${x} differs from ${y}`);
const sum = a => a.reduce((s,x)=>s+x,0);
const marginals = C => [C.map(sum),C[0].map((_,j)=>sum(C.map(row=>row[j])))];

test('TV agrees with exhaustive event search and all three couplings preserve marginals',()=>{
  for(const shift of [0,1e-12,.13,.5,1]){
    const {mu,nu}=M.distributionPair(shift);let eventMaximum=0;
    for(let mask=0;mask<32;mask++)eventMaximum=Math.max(eventMaximum,Math.abs(sum(mu.map((x,i)=>(mask>>i&1)?x-nu[i]:0))));
    near(M.totalVariation(mu,nu),eventMaximum);
    for(const kind of ['maximal','independent','quantile']){
      const C=M.couplingMatrix(mu,nu,kind),[a,b]=marginals(C);
      for(let i=0;i<5;i++){near(a[i],mu[i]);near(b[i],nu[i]);}
      assert.ok(C.flat().every(x=>x>=-1e-15));assert.ok(M.disagreement(C)>=eventMaximum-1e-14);
      if(kind==='maximal')near(M.disagreement(C),eventMaximum);
    }
  }
});
test('finite kernels conserve probability and uniform stationary law, including periodic failure',()=>{
  for(const P of [M.cycleKernel(6),M.cycleKernel(6,0),M.pathKernel(6),M.roomKernel(3,.001),M.roomKernel(3,.2)]){
    for(const row of P){near(sum(row),1);assert.ok(row.every(x=>x>=0));}
    M.advance(M.uniform(P.length),P).forEach(x=>near(x,1/P.length));
    const profile=M.mixingProfile(P,100);
    for(let t=0;t<=100;t++)assert.ok(profile.d[t]<=profile.pair[t]+1e-13&&profile.pair[t]<=2*profile.d[t]+1e-13);
    for(let s=0;s<=30;s++)for(let t=0;t<=30;t++)assert.ok(profile.pair[s+t]<=profile.pair[s]*profile.pair[t]+1e-13);
  }
  const periodic=M.mixingProfile(M.cycleKernel(6,0),80);assert.equal(periodic.mixingTime,-1);periodic.d.forEach(x=>assert.ok(x>=.5-1e-13));
});
test('sticky pair transition has each required marginal at every pair, and diagonal is absorbing',()=>{
  const P=M.pathKernel(5);
  for(let x=0;x<5;x++)for(let y=0;y<5;y++){
    const law=Array.from({length:5},(_,a)=>Array.from({length:5},(_,b)=>+(a===x&&b===y)));
    const next=M.stickyPairStep(law,P),[a,b]=marginals(next);
    for(let j=0;j<5;j++){near(a[j],P[x][j]);near(b[j],P[y][j]);}
    if(x===y)near(M.disagreement(next),0);
  }
});
test('exact coupling survival bounds pointwise TV without Monte Carlo claims',()=>{
  for(const P of [M.cycleKernel(6),M.pathKernel(6),M.roomKernel(3,.07)]){
    const tail=M.stickyTail(P,100),profile=M.mixingProfile(P,100);
    for(let t=0;t<=100;t++){
      const tv=M.totalVariation(profile.powers[t][0],M.uniform(P.length));assert.ok(tv<=tail[t]+2e-13);
      if(t)assert.ok(tail[t]<=tail[t-1]+2e-13);
    }
  }
});
test('cycle recurrence agrees with independent Fourier eigenfunction expansion and n-squared bounds',()=>{
  for(const n of [3,4,5,8,16]){
    const model=M.cycleMixing(n,n*n);
    for(const t of [0,1,5,17,n*n].filter(t=>t<=n*n)){
      const row=Array.from({length:n},(_,j)=>sum(Array.from({length:n},(_,k)=>(.5+.5*Math.cos(2*Math.PI*k/n))**t*Math.cos(2*Math.PI*k*j/n)))/n);
      near(model.d[t],sum(row.map(x=>Math.abs(x-1/n)))/2);
    }
    assert.ok(model.mixingTime>=n*n/32&&model.mixingTime<=n*n);
  }
});
test('hypercube aggregation equals independent full-vertex propagation; coupon and spectral bounds hold',()=>{
  for(let n=2;n<=7;n++){
    const model=M.cubeMixing(n,50);let row=Array(2**n).fill(0);row[0]=1;
    for(let t=0;t<=50;t++){
      const fullTV=sum(row.map(x=>Math.abs(x-2**-n)))/2;near(model.d[t],fullTV);
      assert.ok(model.d[t]<=model.couponTail[t]+1e-13);assert.ok(model.d[t]<=model.upper[t]+1e-13);
      const next=row.map(x=>x/2);
      for(let x=0;x<row.length;x++)for(let i=0;i<n;i++)next[x^(1<<i)]+=row[x]/(2*n);
      row=next;
    }
  }
});
test('hypercube distinguishing-statistic moments match complete-state sums',()=>{
  for(let n=2;n<=6;n++){
    let row=Array(2**n).fill(0);row[0]=1;
    for(let t=0;t<30;t++){
      const stat=x=>n-2*x.toString(2).replaceAll('0','').length;
      const mean=sum(row.map((p,x)=>p*stat(x))),variance=sum(row.map((p,x)=>p*(stat(x)-mean)**2));
      const m=M.cubeStatistic(n,t);near(m.mean,mean);near(m.variance,variance);assert.ok(m.lower<=sum(row.map(p=>Math.abs(p-2**-n)))/2+1e-12);
      const next=row.map(x=>x/2);for(let x=0;x<row.length;x++)for(let i=0;i<n;i++)next[x^(1<<i)]+=row[x]/(2*n);row=next;
    }
  }
});
test('rooms bottleneck and mixing thresholds agree with closed two-block solution',()=>{
  for(const crossing of [.001,.01,.07,.2]){
    const P=M.roomKernel(3,crossing),b=M.bottleneck(P),profile=M.mixingProfile(P,900);
    near(b.phi,crossing);near(b.lowerBound,1/(4*crossing));
    for(let t=1;t<=900;t++)near(profile.d[t],.5*(1-2*crossing)**t);
    assert.ok(profile.mixingTime>=b.lowerBound);
  }
});
test('CFTP retains all old maps on horizon doubling, composes in chronological order and exposes incomplete runs',()=>{
  for(const n of [2,4,7])for(const seed of [1,19,337,100003]){
    const m=M.cftp(n,seed,10);assert.equal(m.complete,true);
    for(const a of m.attempts){
      assert.equal(a.paths[0].length,a.T+1);
      for(let x=0;x<n;x++){
        let current=x;
        for(let past=a.T;past>=1;past--)current=m.maps[past-1]?Math.min(n-1,current+1):Math.max(0,current-1);
        assert.equal(current,a.states[x]);
        for(let t=0;t<a.T;t++)assert.ok(Math.abs(a.paths[x][t+1]-a.paths[x][t])<=1);
      }
    }
    const longer=M.cftp(n,seed,11);assert.deepEqual(longer.maps.slice(0,m.maps.length),m.maps);assert.equal(longer.output,m.output);
    assert.ok(m.attempts.at(-1).states.every(x=>x===m.output));
  }
  const incomplete=M.cftp(7,1,0);assert.equal(incomplete.complete,false);assert.equal(incomplete.output,null);
});

test('reflected traces retain prefixes and coalescence, whereas individual maps need not preserve stationarity',()=>{
  for(let n=3;n<=9;n++)for(const seed of[1,73,337,49999])for(const same of[true,false]){
    const m=M.pathTrajectories(n,seed,80,same),prefix=M.pathTrajectories(n,seed,20,same);
    assert.deepEqual(m.a.slice(0,21),prefix.a);assert.deepEqual(m.b.slice(0,21),prefix.b);
    for(let t=0;t<=80;t++){assert.ok(m.a[t]>=0&&m.b[t]<n);if(same)assert.ok(m.a[t]<=m.b[t]);if(t){assert.ok(Math.abs(m.a[t]-m.a[t-1])<=1&&Math.abs(m.b[t]-m.b[t-1])<=1);if(m.a[t-1]===m.b[t-1])assert.equal(m.a[t],m.b[t]);}}
  }
  const n=3,up=M.uniform(n).map((_,j)=>j===0?0:j===n-1?2/n:1/n),down=[2/3,1/3,0];
  assert.ok(M.totalVariation(up,M.uniform(n))>0);up.map((p,j)=>(p+down[j])/2).forEach(p=>near(p,1/n));
});

test('exhaustive IID past-map composition exposes censoring instead of biasing an exact-sampling claim',()=>{
  // All 4096 tapes are equally likely ideal fair-sign histories, independent of the display PRNG.
  const T=12,n=3,success=Array(n).fill(0);let unfinished=0;
  for(let tape=0;tape<2**T;tape++){
    const images=Array.from({length:n},(_,x)=>{for(let k=T-1;k>=0;k--)x=tape>>k&1?Math.min(n-1,x+1):Math.max(0,x-1);return x;});
    if(images.every(x=>x===images[0]))success[images[0]]++;else unfinished++;
  }
  assert.equal(unfinished,2);assert.equal(success.reduce((s,x)=>s+x,0)+unfinished,2**T);
  success.forEach(c=>assert.ok(Math.abs(c/2**T-1/n)<=unfinished/2**T));
  // At a two-map work limit only the two extreme states can be returned: silently conditioning is biased.
  const two=[0,0,0];for(let tape=0;tape<4;tape++){const images=Array.from({length:3},(_,x)=>{for(let k=1;k>=0;k--)x=tape>>k&1?Math.min(2,x+1):Math.max(0,x-1);return x;});if(images.every(x=>x===images[0]))two[images[0]]++;}
  assert.deepEqual(two,[1,0,1]);
});

test('Doeblin common-component certificates use every block entry and bound all row distances',()=>{
  for(const kind of['cycle','path','rooms','periodic']){
    const P=M.finiteKernel(kind),profile=M.mixingProfile(P,80),R=profile.powers[6],delta=6*Math.min(...R.flat());
    assert.ok(delta>=0&&delta<=1);for(let i=0;i<6;i++)for(let j=0;j<6;j++)assert.ok(R[i][j]>=delta/6-1e-14);
    for(let t=0;t<=80;t++)assert.ok(profile.d[t]<=(1-delta)**Math.floor(t/6)+2e-13);
    assert.equal(delta===0,kind==='periodic');
  }
});
