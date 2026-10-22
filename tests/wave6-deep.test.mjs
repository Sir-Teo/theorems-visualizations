import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as M from '../assets/js/viz/math.js';
import * as B from '../content/deep/ch07.shared.js';
const near=(a,b,t=2e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const norm=a=>Math.hypot(...a);
const finiteDerivative=(f,a,j,h=1e-5)=>{const p=a.slice(),q=a.slice();p[j]+=h;q[j]-=h;return(f(p)-f(q))/(2*h);};
const simpson=(f,a,b,n=400)=>{const h=(b-a)/n;let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+i*h);return s*h/3;};

test('sine covariance and tangent limit agree with independent Gaussian quadrature',()=>{
  for(const [x,y] of [[0,0],[-.7,.7],[-2,1],[1,1]]){
    const normal=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
    const integral=f=>simpson(w=>normal(w)*simpson(b=>normal(b)*f(w,b),-9,9,180),-9,9,180);
    const s=integral((w,b)=>Math.sin(w*x+b)*Math.sin(w*y+b)),c=integral((w,b)=>Math.cos(w*x+b)*Math.cos(w*y+b));
    near(s,B.covariance(x,y),2e-12);near(c,B.cosineCovariance(x,y),2e-12);near(s+(x*y+1)*c,B.tangentLimit(x,y),2e-12);
  }
});
test('random networks retain nested neurons, exact duplicate inputs and honest covariance SE',()=>{
  assert.deepEqual(B.initialize(M,8,7),B.initialize(M,64,7).slice(0,24));
  const a=B.cloud(M,{width:16,reps:10000,seed:11}),b=B.cloud(M,{width:16,reps:1,seed:11});assert.deepEqual(a.points[0],b.points[0]);assert.equal(b.products.se,null);
  assert.ok(Math.abs(a.products.mean-a.covariance)<6*a.products.se);
  for(const p of B.cloud(M,{width:1,reps:100,x:.4,y:.4}).points)assert.equal(p[0],p[1]);
  const projection=B.summary(a.projection);assert.ok(Math.abs(projection.variance-a.variance)<.04);
});
test('parameter gradients and Gram dynamics match finite differences and energy decrease',()=>{
  const theta=B.initialize(M,4,5),xs=[-2,-.123,0,.713,2],data=[[-1,.6],[.2,-.7],[1.1,.3]];
  for(const x of xs)B.gradient(theta,x).forEach((g,j)=>near(g,finiteDerivative(t=>B.prediction(t,x),theta,j),5e-10));
  const K=B.tangentGram(theta,xs),q=[1,-3,2,.4,-1],quad=B.dot(q,K.map(row=>B.dot(row,q))),g=theta.map((_,j)=>B.sum(xs.map((x,i)=>q[i]*B.gradient(theta,x)[j])));near(quad,B.dot(g,g));
  const loss=t=>B.mean(data.map(([x,y])=>(B.prediction(t,x)-y)**2))/2,velocity=B.networkVelocity(theta,data);
  velocity.forEach((u,j)=>near(u,-finiteDerivative(loss,theta,j),1e-9));
  near(B.dot(velocity,theta.map((_,j)=>finiteDerivative(loss,theta,j))),-B.dot(velocity,velocity),1e-9);
  const rankOne=B.tangentGram(B.initialize(M,1,3),xs),eigen=M.eigSym(rankOne).values;assert.ok(Math.abs(eigen[3])<1e-12&&Math.abs(eigen[4])<1e-12);
});
test('Gaussian conditioning has exact empty and duplicate-observation formulas without jitter',()=>{
  for(const noise of [.02,.137,.8]){
    const prior=B.gpPosterior(M,[],noise);near(prior.at(.7).mean,0);near(prior.at(.7).variance,B.covariance(.7,.7));
    const x=.713,ys=[.2,-1,.8],k=B.covariance(x,x),p=B.gpPosterior(M,ys.map(y=>[x,y]),noise).at(x);near(p.mean,k*B.sum(ys)/(noise**2+ys.length*k));near(p.variance,k*noise**2/(noise**2+ys.length*k));near(p.futureVariance,p.variance+noise**2);
  }
  assert.throws(()=>B.gpPosterior(M,[],0));
  const data=[[-1,.3],[.4,1.2]],noise=.23,p=B.gpPosterior(M,data,noise),a=p.A[0][0],b=p.A[0][1],c=p.A[1][1],det=a*c-b*b;
  for(const x of B.seq(-2,2,23)){const [u,w]=data.map(q=>B.covariance(x,q[0])),expected=(u*(c*data[0][1]-b*data[1][1])+w*(a*data[1][1]-b*data[0][1]))/det;near(p.at(x).mean,expected);near(p.at(x).variance,B.covariance(x,x)-(c*u*u-2*b*u*w+a*w*w)/det);near(p.at(x).variance,B.gpPosterior(M,data.map(q=>[q[0],q[1]*100]),noise).at(x).variance);}
  assert.equal(B.validData([[0,0],[0,1]]),true);assert.equal(B.validData([]),true);for(const bad of [[[3,0]],[[0,NaN]],[[0,0,0]],Array(17).fill([0,0])])assert.equal(B.validData(bad),false);
});
test('kernel flow preserves null residuals and obeys the exact n-normalized exponential',()=>{
  for(const time of [0,.123,3,30]){
    const r=B.kernelFlow(M,[[2,0],[0,0]],[.4,3],[1,-2],time);near(r.output[0],1+(.4-1)*Math.exp(-time));near(r.output[1],3);near(r.coefficients[1],-5*time/2);
    const q=B.kernelFlow(M,[[1,1],[1,1]],[0,0],[1,-1],time);q.output.forEach(x=>near(x,0));
    const p=B.kernelFlow(M,[[2,1],[1,2]],[0,0],[3,1],time),e3=Math.exp(-3*time/2),e1=Math.exp(-time/2);near(p.output[0],3-2*e3-e1);near(p.output[1],1-2*e3+e1);
  }
  const empty=B.kernelRegression(M,{data:[],seed:7,time:30});empty.actual.forEach((x,i)=>near(x,empty.initial[i]));assert.equal(empty.trainMSE,null);
  const conflicting=B.kernelRegression(M,{data:[[.3,1],[.3,-1]],zero:true,time:30});near(conflicting.trainMSE,1);conflicting.actual.forEach(x=>near(x,0));
  const K=[[2,1],[1,2]],labels=[3,1],t=.713,h=1e-5,a=B.kernelFlow(M,K,[0,0],labels,t),b=B.kernelFlow(M,K,[0,0],labels,t+h);a.output.forEach((u,i)=>near((b.output[i]-u)/h,B.dot(K[i],labels.map((y,j)=>y-a.output[j]))/2,3e-5));
});
test('finite neural flow has decreasing loss and separate RK4 convergence error',()=>{
  for(const alpha of [.25,1,16]){
    const opts={width:8,seed:3,time:3,alpha,centered:true},a=B.trainNetwork(M,{...opts,dt:.05}),b=B.trainNetwork(M,{...opts,dt:.025}),c=B.trainNetwork(M,{...opts,dt:.0125});
    const d1=norm(a.theta.map((x,i)=>x-b.theta[i])),d2=norm(b.theta.map((x,i)=>x-c.theta[i]));assert.ok(d1<2e-5,`${alpha}: ${d1}`);assert.ok(d2<d1/7+2e-13,`${alpha}: refinement ${d1}, ${d2}`);
    for(let k=1;k<a.trace.length;k++)assert.ok(a.trace[k].loss<=a.trace[k-1].loss+1e-12);
    if(alpha===16)assert.ok(a.gap<.01);
  }
  const a=B.trainNetwork(M,{width:8,centered:true,alpha:.25}),b=B.trainNetwork(M,{width:8,centered:true,alpha:16});assert.deepEqual(a.frozen,b.frozen);assert.ok(b.final.maxMove<a.final.maxMove);
  const empty=B.trainNetwork(M,{width:8,data:[],time:2});assert.deepEqual(empty.theta,empty.initial);near(empty.gap,0);assert.equal(empty.trainMSE,null);
});
test('centered scaled objective has the implemented parameter gradient',()=>{
  const initial=B.initialize(M,3,12),theta=initial.map((x,j)=>x+.02*(j+1)),data=[[-1,.3],[1,-.4]];
  for(const alpha of [.25,.713,16]){const loss=t=>B.mean(data.map(([x,y])=>(alpha*(B.prediction(t,x)-B.prediction(initial,x))-y)**2))/(2*alpha*alpha),g=B.networkVelocity(theta,data,{alpha,initial});g.forEach((v,j)=>near(v,-finiteDerivative(loss,theta,j),1e-9));}
});
test('random Fourier pairs are unbiased with independently integrated variance and PSD',()=>{
  for(const length of [.2,.713,2])for(const d of [0,.1,1,3]){const r=B.rff(M,{pairs:16,length}),q=d/length,expected=simpson(z=>Math.cos(q*z)*Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),-10,10,1200),second=simpson(z=>Math.cos(q*z)**2*Math.exp(-z*z/2)/Math.sqrt(2*Math.PI),-10,10,1200);near(expected,r.exact(d,0),2e-11);near((second-expected**2)/16,r.variance(d,0),2e-11);}
  const a=B.rff(M,{pairs:4,seed:12}),b=B.rff(M,{pairs:64,seed:12});assert.deepEqual(a.omega,b.omega.slice(0,4));a.approximation.forEach((r,i)=>near(r[i],1));
  const x=[-1,.2,1.5],q=[2,-1,3],quad=B.sum(x.flatMap((u,i)=>x.map((v,j)=>q[i]*q[j]*a.kernel(u,v)))),feature=B.sum(a.omega.map(w=>(B.sum(x.map((u,i)=>q[i]*Math.cos(w*u)))**2+B.sum(x.map((u,i)=>q[i]*Math.sin(w*u)))**2)/a.omega.length));near(quad,feature);assert.ok(quad>=0);
  const values=Array.from({length:2000},(_,i)=>B.rff(M,{pairs:16,seed:i+1,xs:[0,1]}).kernel(1,0)),s=B.summary(values),r=B.rff(M,{pairs:16});assert.ok(Math.abs(s.mean-r.exact(1,0))<6*s.se);assert.ok(Math.abs(s.variance/r.variance(1,0)-1)<.12);
});
test('periodic spectral example integrates to its MSE and genuinely reverses rate order',()=>{
  for(const mode of ['low frequencies first','high frequencies first'])for(const t of [0,.713,2,20]){const s=B.spectrum(t,mode);near(simpson(x=>(s.target(x)-s.fit(x))**2,-Math.PI,Math.PI,1200)/(2*Math.PI),s.error(t),1e-12);s.learned.forEach((a,i)=>near(a/s.amplitudes[i],1-Math.exp(-s.rates[i]*t)));}
  const a=B.spectrum(2),b=B.spectrum(2,'high frequencies first');assert.ok(a.learned[0]/a.amplitudes[0]>a.learned[2]/a.amplitudes[2]);assert.ok(b.learned[0]/b.amplitudes[0]<b.learned[2]/b.amplitudes[2]);
});
test('mean-field particle velocity is width-accelerated risk descent and duplication invariant',()=>{
  const theta=B.initializeParticles(M,4,5),data=[[-1,.2],[.4,-.3]],loss=t=>B.mean(data.map(([x,y])=>(B.particlePrediction(t,x)-y)**2))/2,g=B.particleVelocity(theta,data);
  g.forEach((v,j)=>near(v,-4*finiteDerivative(loss,theta,j),1e-9));
  const duplicated=theta.concat(theta),g2=B.particleVelocity(duplicated,data);assert.deepEqual(g,g2.slice(0,g.length));assert.deepEqual(g,g2.slice(g.length));
  const empty=B.trainParticles(M,{width:8,data:[],time:2});assert.equal(empty.trainMSE,null);assert.deepEqual(empty.theta,empty.initial);
  const a=B.trainParticles(M,{width:16,time:4,dt:.1}),b=B.trainParticles(M,{width:16,time:4,dt:.05}),c=B.trainParticles(M,{width:16,time:4,dt:.025}),d1=norm(a.theta.map((x,i)=>x-b.theta[i])),d2=norm(b.theta.map((x,i)=>x-c.theta[i]));assert.ok(d1<1e-6);assert.ok(d2<d1/8+1e-13);for(let j=1;j<a.trace.length;j++)assert.ok(a.trace[j][1]<=a.trace[j-1][1]+1e-12);
  for(const x of [-2,-.713,0,1,2])near(B.particlePrediction(a.theta,x),-B.particlePrediction(a.theta,-x));
});
test('mean-field Lipschitz constants bound finite coupled perturbations',()=>{
  const a=B.initializeParticles(M,8,5),b=a.map((x,j)=>x+.04*Math.sin(j)),data=[[-2,2],[.3,-1],[1.5,.8]],G=Math.sqrt(5),C=20;
  const distance=(a,b)=>B.mean(Array.from({length:a.length/2},(_,i)=>Math.hypot(a[2*i]-b[2*i],a[2*i+1]-b[2*i+1]))),D=distance(a,b),ga=B.particleVelocity(a,data),gb=B.particleVelocity(b,data);
  assert.ok(distance(ga,gb)<=C*D);for(const x of [-2,-1,0,1,2])assert.ok(Math.abs(B.particlePrediction(a,x)-B.particlePrediction(b,x))<=G*D);
  const q=t=>B.mean(Array.from({length:t.length/2},(_,i)=>Math.sin(t[2*i])+Math.cos(t[2*i+1]))),analytic=B.mean(Array.from({length:a.length/2},(_,i)=>Math.cos(a[2*i])*ga[2*i]-Math.sin(a[2*i+1])*ga[2*i+1]));near((q(a.map((x,j)=>x+1e-5*ga[j]))-q(a.map((x,j)=>x-1e-5*ga[j])))/2e-5,analytic,1e-10);
});
test('muP physical SGD matches group gradients and exact neuron-duplication scaling',()=>{
  const data=[[-1,.2],[.7,-.4]],eta=.0713;
  for(const mode of ['μP','standard']){const t=B.physicalInitialization(M,3,9,mode),loss=q=>B.mean(data.map(([x,y])=>(B.physicalPrediction(q,x)-y)**2))/2,u=B.physicalStep(t,data,eta,mode);u.forEach((v,j)=>near(v,t[j]-eta*(mode==='μP'?(j%2?1/3:3):1)*finiteDerivative(loss,t,j),1e-9));}
  const a=B.physicalInitialization(M,4,8,'μP'),b=a.map((x,j)=>j%2?x/2:x).concat(a.map((x,j)=>j%2?x/2:x)),u=B.physicalStep(a,data,eta,'μP'),v=B.physicalStep(b,data,eta,'μP');
  for(const x of [-2,-.1,1,2]){near(B.physicalPrediction(a,x),B.physicalPrediction(b,x));near(B.physicalPrediction(u,x),B.physicalPrediction(v,x));}
  u.forEach((x,j)=>near(v[j],j%2?x/2:x));
});
test('rate sweep reports actual held-out selection, finite failures and odd architecture',()=>{
  const rows=B.transferSweep(M,{steps:8,seed:3});assert.equal(rows.length,4);
  for(const row of rows){assert.equal(row.runs.length,11);assert.equal(row.best.testMSE,Math.min(...row.runs.map(r=>r.testMSE)));const run=row.runs[4],independent=B.physicalTrain(M,{width:row.width,steps:8,seed:3,eta:run.eta,xs:run.xs});near(run.testMSE,independent.testMSE);for(const x of [-2,.3,1])near(B.physicalPrediction(run.theta,x),-B.physicalPrediction(run.theta,-x));}
  assert.equal(B.physicalTrain(M,{data:[],steps:30}).trainMSE,null);
  const failed=B.physicalTrain(M,{mode:'standard',width:512,eta:10**.5,steps:60});assert.equal(failed.diverged,true);assert.equal(failed.testMSE,Infinity);assert.equal(failed.actual.length,0);
});
test('frozen identities and authored syllabus match; cross-chapter proof inputs are written',async()=>{
  const plan=JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json',import.meta.url))),frozen=plan.chapters.find(c=>(c.col||c.collection)==='deep').items,parts=await Promise.all(['','-b'].map(p=>import(`../content/deep/ch07${p}.js`))),items=parts.flatMap(p=>p.default.items),syllabus=(await import('../content/deep/syllabus.js')).default.chapters.find(c=>c.n===7).items;
  assert.equal(items.length,10);assert.equal(frozen.length,10);
  for(const [j,item] of items.entries()){assert.equal('deep-'+item.num,frozen[j].id);for(const key of ['name','kind','verify','paper','introduces']){assert.deepEqual(item[key],frozen[j][key]);assert.deepEqual(item[key],syllabus[j][key]);}assert.deepEqual(item.deps,syllabus[j].deps);assert.deepEqual(item.refs,syllabus[j].refs);assert.equal(item.caption,syllabus[j].pic);for(const key of ['statement','idea','caption','scope'])assert.ok(item[key]?.length>100);assert.equal(typeof item.viz,'function');assert.ok(!item.refs.some(s=>s.includes('Prince')));}
  for(const id of new Set(items.flatMap(i=>i.deps).filter(id=>!id.startsWith('deep-7.')))){const [col,num]=id.split('-'),chapter=num.split('.')[0].padStart(2,'0'),dir=new URL('../content/'+col+'/',import.meta.url);let found=false;for(const f of fs.readdirSync(dir).filter(f=>new RegExp('^ch'+chapter+'(?:-[a-z0-9]+)?\\.js$').test(f))){const m=(await import(new URL(f,dir))).default;if(m.items.some(i=>i.num===num))found=true;}assert.ok(found,id+' is written');}
});
