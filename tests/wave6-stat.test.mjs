import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../assets/js/viz/math.js';
import * as B from '../content/stat/ch10.shared.js';
const near=(a,b,t=2e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const integrate=(f,a,b,n=20000)=>{const h=(b-a)/n;let s=0;for(let i=0;i<n;i++)s+=f(a+(i+.5)*h);return s*h;};
const factorial=n=>{let r=1;for(let k=2;k<=n;k++)r*=k;return r;};
const choose=(n,k)=>factorial(n)/factorial(k)/factorial(n-k);

test('beta evidence, sequential updates and posterior mixtures normalize independently',()=>{
  for(let n=0;n<=18;n++)for(let s=0;s<=n;s++){
    const u=B.betaUpdate(M,1,1,s,n);near(Math.exp(u.logEvidence),1/((n+1)*choose(n,s)));
    near(u.mean,(s+1)/(n+2));const seq=B.betaUpdate(M,u.a,u.b,1,1),direct=B.betaUpdate(M,1,1,s+1,n+1);near(seq.mean,direct.mean);
  }
  for(const weights of [[1,0,0],[0,1,0],[1,2,3],[.012345,.88888,.1]]){
    const m=B.mixtureUpdate(M,[[1,1],[2,8],[8,2]],weights,4,9);
    near(integrate(m.posterior.pdf,0,1),1,2e-8);
    for(const p of [.01,.12345,.5,.87,.99])near(m.posterior.pdf(p),m.prior.pdf(p)*p**4*(1-p)**5/Math.exp(m.logEvidence),2e-11);
  }
  const edge=B.betaMixture(M,[[.5,.5],[1,1]],[1,0]);assert.equal(edge.pdf(0),Infinity);assert.equal(edge.pdf(1),Infinity);
});
test('seeded coin observations are nested and endpoints stay certain',()=>{
  for(const p of [0,.371234,1]){const a=B.betaCoin(M,{p,n:8}),b=B.betaCoin(M,{p,n:80});assert.deepEqual(b.points.slice(0,8),a.points);assert.equal(a.s,a.points.filter(x=>x.success).length);if(p===0||p===1)assert.equal(a.s,p*8);}
  for(const n of [0,1,10,50]){const groups=B.succession(M,n,10000,17);assert.equal(B.sum(groups.map(g=>g.count)),10000);for(const g of groups)if(g.count>100)assert.ok(Math.abs(g.observed-g.predicted)<6*g.se+.001);}
});
test('normal posterior is a normalized product and predictive samples include parameter variance',()=>{
  for(const n of [0,1,17,200])for(const tau of [.2,.713,3]){
    const p=B.normalUpdate(M,{mu:-1,tau,sigma:2,n,xbar:.7});near(p.variance,4*tau*tau/(4+n*tau*tau));near(p.mean,(4*-1+n*tau*tau*.7)/(4+n*tau*tau));near(p.predictive.variance,4+p.variance);
  }
  const p=B.normalPredictive(M,{mu:0,tau:2,sigma:1,n:1,xbar:0},10000,19);
  assert.ok(Math.abs(p.measured.mean-p.mean)<6*p.measured.se);assert.ok(Math.abs(p.measured.variance-p.predictive.variance)<.12);
});
test('gamma shape/rate posterior and mixed count probabilities agree with direct integration',()=>{
  for(const exposure of [0,.3125,4,20])for(const futureExposure of [.1,1,3]){
    const p=B.gammaUpdate(M,{a:2,rate:1,count:exposure?3:0,exposure,futureExposure});near(p.law.mean,p.shape/p.rate);near(p.predictive.mean,p.predictiveMean);near(p.predictive.variance,p.predictiveVariance);
    const max=p.law.quantile(1-1e-12);for(const k of [0,1,5])near(integrate(x=>p.law.pdf(x)*Math.exp(-futureExposure*x)*(futureExposure*x)**k/factorial(k),0,max,100000),p.predictive.pmf(k),1e-8);
  }
});
test('credible sets retain disconnected components, exact masses and equal endpoint density',()=>{
  for(const kind of ['skewed','symmetric','bimodal'])for(const mass of [.5,.623456,.9,.95,.99]){
    const c=B.credibleSets(M,kind,mass);near(c.hpdMass,mass);near(c.equalMass,mass);assert.ok(c.hpdLength<=c.equalLength+1e-12);
    for(const [a,b] of c.hpd){near(c.law.pdf(a),c.level);near(c.law.pdf(b),c.level);assert.ok(c.law.pdf((a+b)/2)>c.level);}
    assert.equal(c.hpd.length,kind==='bimodal'?2:1);if(kind==='symmetric'){near(c.hpd[0][0],c.equalTailed[0]);near(c.hpd[0][1],c.equalTailed[1]);}
  }
});
test('credible coverage is conditional on truth; prior averaging recovers nominal mass',()=>{
  for(const truth of [0,.4,1,2]){const c=B.coverage(M,{truth,reps:10000,seed:15});assert.ok(Math.abs(c.observed-c.exact)<6*c.se+.001);}
  const c=B.coverage(M,{priorAverage:true,reps:10000,seed:15});near(c.exact,.95);assert.ok(Math.abs(c.observed-.95)<6*c.se);
  assert.ok(B.coverage(M,{truth:2}).exact<.1);
});
test('Gaussian Bayes factor equals predictive-density ratio and Lindley limit fixes z',()=>{
  for(const n of [1,5,50,1000,1e8])for(const z of [0,1,2.5,4])for(const tau of [.2,1,3]){
    const b=B.gaussianBayesFactor({n,z,tau,priorNull:.3});const ratio=M.dist.normal(0,1/Math.sqrt(n)).pdf(b.xbar)/M.dist.normal(0,Math.sqrt(tau*tau+1/n)).pdf(b.xbar);near(b.BF,ratio,2e-10);near(b.posteriorNull,.3*ratio/(.3*ratio+.7));
  }
  assert.ok(B.gaussianBayesFactor({n:1e8}).posteriorNull>.99);assert.ok(B.gaussianBayesFactor({n:10}).posteriorNull<.5);
});
test('posterior mixture evidence and standardized asymptotics preserve all components',()=>{
  const p=B.normalMixtureUpdate(M,[[-2,.4],[2,.7]],[.3,.7],17,.4);
  near(B.sum(p.weights),1);near(integrate(p.pdf,-5,5),1,1e-10);
  const prior=x=>.3*M.dist.normal(-2,.4).pdf(x)+.7*M.dist.normal(2,.7).pdf(x),lik=x=>M.dist.normal(x,1/Math.sqrt(17)).pdf(.4);
  for(const x of [-1,0,.4,1,2])near(p.pdf(x),prior(x)*lik(x)/Math.exp(p.logEvidence));
  for(const n of [4,16,64,256,1024]){const b=B.bvmExample(M,n,5);assert.equal(b.data.length,n);near(b.xbar,B.mean(b.data));assert.equal(b.atomTV,1);for(const m of b.models){assert.ok(m.tv>=0&&m.tv<=1.00001);assert.ok(m.tailBound<1e-15);}}
  assert.ok(B.bvmExample(M,1024,5).models[1].tv<.002);
});
test('Polya finite-count law is exchangeable but generally not iid',()=>{
  for(const n of [1,2,10,100]){const p=B.polya(M,{a:2,b:3,n,reps:100,seed:9}),mass=B.sum(Array.from({length:n+1},(_,k)=>p.pmf(k))),avg=B.sum(Array.from({length:n+1},(_,k)=>k/n*p.pmf(k)));near(mass,1,2e-11);near(avg,p.mean,2e-11);near(B.sum(Array.from({length:n+1},(_,k)=>(k/n-p.mean)**2*p.pmf(k))),p.variance,2e-11);}
  const wordProb=word=>{let a=2,b=3,p=1;for(const s of word){p*=s?a/(a+b):b/(a+b);s?a++:b++;}return p;};near(wordProb([1,0,1,0]),wordProb([1,1,0,0]));assert.notEqual(wordProb([1,1]),.4**2);assert.equal(B.finiteExchangeable().covariance,-.25);
});
test('partial pooling integrates uncertainty in the shared mean and handles zero group variance',()=>{
  const zero=B.pooling(0);assert.ok(zero.means.every(x=>x===zero.mu));assert.ok(zero.variances.every(x=>x===zero.muVariance));
  for(const tau of [.00001,.713,5,30,1000]){const p=B.pooling(tau);for(let i=0;i<8;i++){assert.ok(p.weights[i]>0&&p.weights[i]<1);near(p.means[i],p.weights[i]*B.GROUP_Y[i]+(1-p.weights[i])*p.mu);assert.ok(p.variances[i]>0);}}
  const large=B.pooling(1000);large.means.forEach((m,i)=>near(m,B.GROUP_Y[i],.0002));
  const a=B.improperIntegral(20),b=B.improperIntegral(30);near(b.logFlat-a.logFlat,10,1e-8);assert.ok(b.halfNormal-a.halfNormal<1e-7);
});
test('importance-sampling variance is independently integrated, with an actual infinite-variance case',()=>{
  for(const proposalSd of [1,2])for(const proposalMean of [0,3,6]){
    const p=B.importance(M,{proposalSd,proposalMean,n:3000}),q=M.dist.normal(proposalMean,proposalSd),f=M.dist.normal(0,1);
    const second=integrate(x=>f.pdf(x)**2/q.pdf(x),3,18,50000);near(p.variance,second-p.truth*p.truth,2e-8);assert.ok(p.ess>0&&p.ess<=3000+1e-9);near(p.estimate,B.mean(p.values));
  }
  assert.equal(B.importance(M,{proposalSd:.5}).variance,Infinity);assert.equal(B.importance(M,{proposalSd:.5}).exactSE,Infinity);
});
test('Metropolis executes proposals, keeps rejected states and satisfies pointwise balance',()=>{
  for(const scale of [.05,.713,5]){
    const r=B.metropolis(M,{scale,n:200,seed:42});assert.equal(r.states.length,201);assert.equal(r.accepted,r.proposals.filter(p=>p.accepted).length);
    r.proposals.forEach((p,i)=>{assert.deepEqual(r.states[i+1],p.accepted?p.candidate:r.states[i]);assert.equal(p.accepted,p.u<p.alpha);const a=Math.exp(B.bananaLog(...r.states[i])),b=Math.exp(B.bananaLog(...p.candidate));near(a*p.alpha,b*Math.min(1,a/b),1e-12);});
  }
  assert.ok(B.metropolis(M,{scale:5,n:1000}).rate<B.metropolis(M,{scale:.05,n:1000}).rate);
});
test('Gaussian Gibbs staircase and exact finite-n stationary mean variance match AR covariance',()=>{
  for(const rho of [-.99,-.4,0,.4,.99]){const g=B.gaussianGibbs(M,{rho,n:80,seed:7});for(let k=0;k<80;k++){near(g.path[2*k][1],g.path[2*k+1][1]);near(g.path[2*k+1][0],g.path[2*k+2][0]);}let v=0;for(let i=0;i<80;i++)for(let j=0;j<80;j++)v+=rho**(2*Math.abs(i-j));near(g.stationaryMeanVariance,v/(80*80));near(g.theoreticalLag(1),rho*rho);}
  const means=Array.from({length:1000},(_,i)=>B.gaussianGibbs(M,{rho:.8,n:40,seed:i+1}).mean),s=B.summary(means),theory=B.gaussianGibbs(M,{rho:.8,n:40}).stationaryMeanVariance;
  assert.ok(Math.abs(s.mean)<6*Math.sqrt(theory/1000));assert.ok(Math.abs(s.variance-theory)<.02);
});

function denseMarginalLog(between,within){
  const y=B.VARIANCE_DATA.flat(),n=y.length,A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>(i===j?within:0)+(Math.floor(i/3)===Math.floor(j/3)?between:0)+4)),L=Array.from({length:n},()=>Array(n).fill(0));let logDet=0;
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){let s=A[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];L[i][j]=i===j?Math.sqrt(s):s/L[j][j];if(i===j)logDet+=2*Math.log(L[i][j]);}
  const z=[];for(let i=0;i<n;i++){let s=y[i];for(let j=0;j<i;j++)s-=L[i][j]*z[j];z.push(s/L[i][i]);}
  const logIG=x=>2*Math.log(2)-4*Math.log(x)-2/x;
  return -.5*(n*Math.log(2*Math.PI)+logDet+B.sum(z.map(x=>x*x)))+logIG(between)+logIG(within);
}
test('variance-components collapsed likelihood matches independent dense nine-dimensional covariance',()=>{
  for(const between of [.001,.1,.713,1,3,20,100])for(const within of [.001,.2,.871,1,5,50])near(B.varianceLogMarginal(M,between,within),denseMarginalLog(between,within),5e-10);
  const a=B.varianceReference(M,{steps:80}),b=B.varianceReference(M,{steps:160}),c=B.varianceReference(M,{steps:240,lo:-8,hi:8});near(a.meanBetween,b.meanBetween,3e-8);near(a.meanWithin,b.meanWithin,3e-8);near(b.meanBetween,c.meanBetween,2e-7);near(b.meanWithin,c.meanWithin,2e-7);near(B.sum(c.betweenLogMass),1);near(B.sum(c.withinLogMass),1);
});
test('Gelfand-Smith full conditionals, replicated chains and conditional imputation preserve the declared model',()=>{
  const s={theta:[-1,1,3],mu:1,between:2,within:3},c=B.varianceConditionals(M,s);near(c.between.shape,4.5);near(c.between.scale,6);near(c.within.shape,7.5);near(c.within.scale,5);near(c.mu.mean,6/7); // precision: (sum theta / 2) / (1/4 + 3/2)
  c.theta.forEach((d,i)=>near(d.mean,((i*2-1)+.5)/1.5));
  const a=B.varianceExperiment(M,{cycles:10,chains:10,seed:3}),b=B.varianceExperiment(M,{cycles:10,chains:100,seed:3});assert.deepEqual(a.rawBetween,b.rawBetween.slice(0,10));assert.deepEqual(a.trace,b.trace);assert.equal(a.trace.length,41);
  const ref=B.varianceReference(M),long=B.varianceExperiment(M,{cycles:40,chains:2000,seed:17});assert.ok(Math.abs(long.rbBetween.mean-ref.meanBetween)<6*long.rbBetween.se);assert.ok(Math.abs(long.rbWithin.mean-ref.meanWithin)<6*long.rbWithin.se);assert.ok(B.varianceExperiment(M,{cycles:1,chains:1000}).rbWithin.mean>ref.meanWithin+0.8);
});
test('invalid numeric domains do not silently become unrelated posterior experiments',()=>{
  for(const x of [NaN,Infinity,-Infinity]){assert.throws(()=>B.normalUpdate(M,{tau:x}));assert.throws(()=>B.pooling(x));assert.throws(()=>B.coverage(M,{truth:x}));}
  assert.throws(()=>B.normalize([0,0]));assert.throws(()=>B.betaUpdate(M,1,1,2,1));assert.throws(()=>B.gammaUpdate(M,{exposure:0,count:1}));assert.throws(()=>B.gaussianGibbs(M,{rho:1}));assert.throws(()=>B.metropolis(M,{n:1.5}));assert.throws(()=>B.credibleSets(M,'unknown'));assert.throws(()=>B.varianceReference(M,{steps:21}));
});

test('Jeffreys density and information retain the same measure under log odds',()=>{
  for(const p of [.01,.123456789,.5,.712345,.99]){const j=B.jeffreys(p);near(j.information*j.jacobian**2,j.informationPhi);near(j.priorP*j.jacobian,j.priorPhi);near(Math.exp(j.phi)/(1+Math.exp(j.phi)),p);}
  near(integrate(x=>B.jeffreys(1/(1+Math.exp(-x))).priorPhi,-30,30,200000),1,4e-7);
});
test('Bayes table conditions on outcomes only, preserves nested throws and posterior intervals',()=>{
  for(const seed of [1,7,20])for(const n of [0,1,20,100]){const t=B.bayesTable(M,{seed,n,lo:0,hi:1});near(t.probability,1);assert.equal(t.successes,t.points.filter(p=>p.point[0]<t.first[0]).length);near(t.predictive,(t.successes+1)/(n+2));const z=B.bayesTable(M,{seed,n:n+1});assert.deepEqual(z.first,t.first);assert.deepEqual(z.points.slice(0,n),t.points);near(B.bayesTable(M,{seed,n,lo:.371234,hi:.371234}).probability,0);}
});
test('chapter identity, historical metadata and authored syllabus agree with frozen Wave 6 inventory',async()=>{
  const {readFile}=await import('node:fs/promises'),plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8'));
  const frozen=plan.chapters.find(c=>(c.col||c.collection)==='stat').items;
  const parts=await Promise.all(['','-b','-c'].map(p=>import(`../content/stat/ch10${p}.js`))),items=parts.flatMap(p=>p.default.items),syllabus=(await import('../content/stat/syllabus.js')).default.chapters.find(c=>c.n===10).items;
  assert.equal(items.length,21);assert.equal(new Set(items.map(i=>i.viz)).size,21);
  for(const [k,i] of items.entries()){const p=frozen[k],s=syllabus[k];assert.equal('stat-'+i.num,p.id);for(const field of['name','kind','verify','paper','introduces']){assert.deepEqual(i[field],p[field]);assert.deepEqual(i[field],s[field]);}assert.deepEqual(i.deps,s.deps);assert.deepEqual(i.refs,s.refs);assert.equal(i.caption,s.pic);assert.equal(typeof i.viz,'function');for(const field of['statement','idea','scope','caption'])assert.ok(i[field]?.length>100);assert.ok(!i.deps.some(d=>d==='stoch-7.2'||d==='stoch-7.3'));}
});

test('upper-tail posterior interval preserves representable mass instead of subtracting two rounded ones',()=>{
  for(const [lo,hi] of [[.98,.99],[.9,1],[.999,.9999]]){const exact=x=>Math.pow(1-x,100)*(1+100*x),expected=exact(lo)-exact(hi),actual=B.betaInterval(M,2,100,lo,hi);assert.ok(actual>0);assert.ok(Math.abs(actual/expected-1)<2e-12);}
});

test('adjacent floating-point interval endpoints preserve positive local posterior mass',()=>{
  for(const [a,b,x] of [[2,2,.5],[16,6,.5],[2,100,.98],[.5,.5,.12345]]){const y=x+Number.EPSILON/2,mass=B.betaInterval(M,a,b,x,y),local=M.dist.beta(a,b).pdf(x)*(y-x);assert.ok(mass>0);assert.ok(Math.abs(mass/local-1)<2e-12);}
  near(B.betaInterval(M,2,2,.4,.400001),6*((.400001**2-.4**2)/2-(.400001**3-.4**3)/3),1e-15);
});
