import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadAll} from '../scripts/lib.mjs';
import * as H from '../content/prob/ch07.shared.js';
const near=(a,b,t=2e-11)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
const integrate=(f,a,b,n=4096)=>{let sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+(b-a)*i/n);return sum*(b-a)/(3*n);};
const diff=(f,x,h=1e-5)=>(f(x+h)-f(x-h))/(2*h);
const second=(f,x,h=1e-3)=>(-f(x+2*h)+16*f(x+h)-30*f(x)+16*f(x-h)-f(x-2*h))/(12*h*h);
const gaussExpectation=f=>(f(-Math.sqrt(3))+4*f(0)+f(Math.sqrt(3)))/6;
function coefficients(level,T){const n=2**level;return Array.from({length:n},(_,k)=>{let j=0;return H.brownian(1,level,T,0,()=>+(j++===k)).map(p=>p[1]);});}
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);

test('dyadic bridge construction has exactly the Brownian covariance, checked by independent Gaussian basis propagation',()=>{
 for(const level of[1,2,3,4])for(const T of[.1,1,8]){const C=coefficients(level,T),n=2**level;for(let i=0;i<=n;i++)for(let j=0;j<=n;j++)near(dot(C.map(a=>a[i]),C.map(a=>a[j])),Math.min(i,j)*T/n);for(let i=0;i<n;i++)for(let j=0;j<n;j++)near(dot(C.map(a=>a[i+1]-a[i]),C.map(a=>a[j+1]-a[j])),i===j?T/n:0);}
});
test('refinement preserves existing nodes, endpoint law and seeded state',()=>{
 for(const seed of[1,17,40])for(const T of[1,4,8]){const fine=H.brownian(seed,9,T,.3);for(let n=1;n<9;n++)assert.deepEqual(H.coarse(fine,n),H.brownian(seed,n,T,.3));assert.equal(fine[0][1],.3);const rng=H.random(seed);near(fine.at(-1)[1],.3+Math.sqrt(T)*H.normal(rng));}
 const a=H.random(37),b=H.random(37);for(let i=0;i<1000;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);}assert.ok(H.normal(()=>0)===0);
});
test('finite-dimensional increments and deleted-coordinate covariances agree with Gaussian linear maps',()=>{
 for(const times of[[0,.25,1],[.05,.73,1],[0,0,1]]){const C=times.map((_,j)=>H.increments(times,times.map((_,k)=>+(j===k))));const cov=H.covariance(times);for(let i=0;i<times.length;i++)for(let j=0;j<times.length;j++)near(dot(C.map(a=>a[i]),C.map(a=>a[j])),cov[i][j]);assert.deepEqual([cov[0][0],cov[0][2],cov[2][2]],[times[0],times[0],times[2]]);}
});
test('polygon interpolation and all-pairs Hölder diagnostics use the actual selected nodes',()=>{
 const p=[[0,0],[.25,1],[.5,-.5],[1,.25]];near(H.at(p,.125),.5);near(H.at(p,.375),.25);assert.equal(H.at(p,0),0);assert.equal(H.at(p,1),.25);
 for(const g of[0,.1,.5,.9]){const d=H.gridStats(p,g);near(d.jump,1.5);near(d.qv,1+2.25+.5625);let maximum=0;for(const [t,x]of p)for(const [u,y]of p)if(t!==u)maximum=Math.max(maximum,Math.abs(x-y)/Math.abs(t-u)**g);near(d.quotient,maximum);}
});
test('Kolmogorov union bounds retain strict summability and agree with a geometric tail',()=>{
 for(const gamma of[.1,.25-Number.EPSILON,.25,.25+Number.EPSILON,.8]){const q=H.momentBound(1,4,gamma,5);assert.equal(q.holder,gamma<.25);if(gamma===.1){let sum=0;for(let n=5;n<300;n++)sum+=2**(-(1-4*gamma)*n);near(q.tail,sum);}if(gamma>=.25)assert.equal(q.tail,null);}
 for(let q=0;q<180;q+=11)for(let gap=1;gap<=64;gap+=7){const a=q/256,b=(q+gap)/256,m=Math.ceil(-Math.log2(b-a)),d=H.chain(a,b,m);assert.ok(d.mesh<=b-a);assert.ok(d.b-d.a<=2*d.mesh);for(const g of[.05,.4,.95,2])assert.ok(2*d.mesh**g/(1-2**(-g))<=3*(b-a)**g/(1-2**(-g)));}
});
test('near-zero and log-time construction preserve the intended conditional bridge and increment coefficients',()=>{
 for(const seed of[1,17,40]){const q=H.nearZero(seed,12),r=H.random(seed);let value=H.normal(r);near(q.at(-1)[1],value);for(let k=1;k<=12;k++){value=value/2+Math.sqrt(2**(-k)/2)*H.normal(r);near(q.find(p=>p[0]===2**(-k))[1],value);}const p=H.logPath(seed,12,.7),rng=H.random(seed);let x=.7+H.normal(rng);near(p[0][1],x);for(let k=1;k<=12;k++){x+=Math.sqrt(2**(k-1))*H.normal(rng);near(p[k][1],x);}}
 for(const s of[.01,.3,1,4])for(const t of[.02,.5,2,9])near(s*t*Math.min(1/s,1/t),Math.min(s,t));
});
test('polygonal crossing search treats signs exactly, retains censorship and handles initial exits',()=>{
 const p=[[0,0],[1,2],[2,-2],[3,1]];assert.deepEqual(H.crossings(p),[0,1.5,2+2/3]);near(H.hit(p,1).time,.5);assert.equal(H.hit(p,3),null);assert.deepEqual(H.stopped(p,-3,3,2.5),{time:2.5,value:-.5,exited:false});near(H.stopped(p,-1,1).time,.5);assert.equal(H.stopped([[0,1],[1,2]],-1,1).time,0);
 assert.equal(H.hit([[0,1e-300],[1,2e-300]],0),null);near(H.hit([[0,-1e-300],[1,1e-300]],0).time,.5);
 for(let j=1;j<=9;j++)assert.ok(H.hit(p,.8*(1-2**(-j))).time<=H.hit(p,.8*(1-2**(-(j+1)))).time);
});
test('strict-up dyadic approximations advance exact grid points and stay monotone at neighboring binary values',()=>{
 for(const t of[0,Number.MIN_VALUE,.375-Number.EPSILON,.375,.375+Number.EPSILON,.73123456789,1]){let old=Infinity;for(let n=0;n<=12;n++){const q=H.strictRound(t,n);assert.ok(q>t);assert.ok(q-t<=2**(-n));assert.ok(q<=old);assert.equal(q*2**n,Math.floor(q*2**n));old=q;}}
 assert.equal(H.strictRound(.375,3),.5);assert.equal(H.strictRound(Infinity,3),Infinity);
});
test('reflection fixes the stopped prefix, negates later displacements and is an involution',()=>{
 const p=[[0,0],[.25,.2],[.5,1],[.75,-.3],[1,.8]];for(const a of[.1,.2,.5,1,1.3]){const q=H.reflect(p,a);if(q.hit){for(const[t,x]of p)near(H.at(q.path,t),t<=q.hit.time?x:2*a-x);const twice=H.reflect(q.path,a);for(const[t,x]of p)near(H.at(twice.path,t),x);near(H.at(q.path,q.hit.time),a);}else assert.deepEqual(q.path,p);}
});
test('normal and reflection CDFs agree with independent quadrature and scaling',()=>{
 for(const x of[-8,-5,-2,-.7,-.001,0,.001,.7,2,5,8]){const ref=.5+Math.sign(x)*integrate(H.normalDensity,0,Math.abs(x));near(H.normalCDF(x),ref,2e-12);near(H.normalCDF(x)+H.normalCDF(-x),1);}
 for(const a of[.1,.8,2])for(const t of[.1,1,4]){near(H.hitCDF(a,t),2*integrate(H.normalDensity,a/Math.sqrt(t),12),3e-12);near(H.hitCDF(a,t),H.hitCDF(1,t/(a*a)),1e-13);const density=a*Math.exp(-a*a/(2*t))/Math.sqrt(2*Math.PI*t**3);near(diff(u=>H.hitCDF(a,u),t),density,3e-6);}
 assert.equal(H.hitCDF(.2,0),0);assert.equal(H.hitCDF(0,0),1);
});
test('last-zero arcsine CDF integrates the transformed density and has no endpoint atoms',()=>{
 for(const s of[0,.001,.2,.5,.9,1]){near(H.arcsineCDF(s),integrate(()=>2/Math.PI,0,Math.asin(Math.sqrt(s))));near(H.arcsineCDF(s)+H.arcsineCDF(1-s),1,1e-12);}for(const s of[.05,.2,.5,.8,.95])near(diff(H.arcsineCDF,s),1/(Math.PI*Math.sqrt(s*(1-s))),1e-8);
});
test('exit probabilities and mean solve their independent boundary-value equations',()=>{
 for(const a of[-2,-.2])for(const b of[.2,1.73,2])for(const u of[0,.2,.731,1]){const x=a+u*(b-a),q=H.exitLaw(a,b,x);near(q.left+q.right,1);near(a*q.left+b*q.right,x);near(a*a*q.left+b*b*q.right-x*x,q.mean);near(second(y=>H.exitLaw(a,b,y).mean,x),-2,2e-8);}
});
test('normal conditional polynomial moments give the martingale identities without simulation',()=>{
 for(const order of[1,2,3,4])for(const t of[0,.3,1])for(const h of[0,.2,1])for(const x of[-1.2,0,.731]){const expected=gaussExpectation(z=>H.heatPolynomial(order,t+h,x+Math.sqrt(h)*z));near(expected,H.heatPolynomial(order,t,x));near(diff(s=>H.heatPolynomial(order,s,x),t)+.5*second(y=>H.heatPolynomial(order,t,y),x),0,3e-8);near(H.heatDx(order,t,x),diff(y=>H.heatPolynomial(order,t,y),x),2e-9);}
});
test('exponential Gaussian expectation and hitting Laplace law agree with independent integrals',()=>{
 for(const theta of[-2,-.3,0,1.7])for(const t of[.1,.7,1])near(integrate(z=>Math.exp(theta*Math.sqrt(t)*z-theta*theta*t/2)*H.normalDensity(z),-12,12),1,2e-11);
 for(const a of[.1,.8,2])for(const lambda of[0,.2,1,3]){const byNormal=2*integrate(z=>z===0?(lambda===0?H.normalDensity(0):0):Math.exp(-lambda*(a/z)**2)*H.normalDensity(z),0,12,32768);near(H.laplaceHit(a,lambda),byNormal,3e-9);}assert.equal(H.laplaceHit(0,3),1);
});
test('second exit moment follows the stopped quartic and the Poisson hierarchy',()=>{
 for(const a of[.2,.73,2])for(const u of[-1,-.4,0,.3,1]){const x=a*u,m1=a*a-x*x,m2=(5*a**4-6*a*a*x*x+x**4)/3;near(a**4-6*a*a*m1+3*m2,x**4);near(second(y=>(5*a**4-6*a*a*y*y+y**4)/3,x)/2,-2*m1,2e-8);assert.ok(m2>=-1e-14);}
});
test('Itô square residual is exactly quadratic variation minus elapsed time, and cubic/sine sums use actual derivatives',()=>{
 for(const seed of[1,17,40])for(const n of[2,5,9]){const p=H.brownian(seed,n),q=H.ito(p,'square');near(q.actual,p.at(-1)[1]**2);const qv=p.slice(1).reduce((s,x,i)=>s+(x[1]-p[i][1])**2,0);near(q.residual,qv-1);for(const kind of['cube','sine']){const d=H.ito(p,kind);let stochastic=0,drift=0;for(let i=1;i<p.length;i++){const[t,x]=p[i-1],[u,y]=p[i];stochastic+=(kind==='cube'?3*x*x:Math.cos(x))*(y-x);drift+=(kind==='cube'?3*x:-Math.sin(x)/2)*(u-t);}near(d.stochastic,stochastic);near(d.drift,drift);near(d.actual,kind==='cube'?p.at(-1)[1]**3:Math.sin(p.at(-1)[1]));}}
});
test('discrete Itô isometry and quadratic-variation variance follow from independently computed Gaussian covariances',()=>{
 for(const level of[1,2,3,4]){const n=2**level,C=coefficients(level,1),inc=Array.from({length:n},(_,j)=>C.map(a=>a[j+1]-a[j]));let qvVar=0;for(const a of inc)for(const b of inc)qvVar+=2*dot(a,b)**2;near(qvVar,2/n);let integralVariance=0;for(let j=0;j<n;j++)integralVariance+=j/n/n;near(integralVariance,(1-1/n)/2);}
});
test('time-dependent Itô drift has the plus sign and finite sums match separately differentiated functions',()=>{
 for(const mu of[-1,-.5,0,1])for(const sigma of[0,.7,1,1.5]){const p=H.brownian(17,6),q=H.timeIto(p,mu,sigma);let stochastic=0,drift=0;for(let i=1;i<p.length;i++){const[t,x]=p[i-1],[u,y]=p[i],f=(s,z)=>Math.exp(mu*s+sigma*z);stochastic+=diff(z=>f(t,z),x)*(y-x);drift+=(diff(s=>f(s,x),t)+.5*second(z=>f(t,z),x))*(u-t);}near(q.stochastic,stochastic,2e-9);near(q.drift,drift,2e-8);near(q.actual,Math.exp(mu+sigma*p.at(-1)[1])-1);}
 assert.equal(H.timeIto(H.brownian(4,5),-.5,1).drift,0);
});
test('two-dimensional product residual equals cross variation and squared-radius residual equals diagonal variation defect',()=>{
 for(const n of[2,6,9]){const p=H.brownian(17,n),q=H.brownian(10024,n);for(const kind of['radius','product']){const d=H.ito2(p,q,kind),cross=p.slice(1).reduce((s,z,i)=>s+(z[1]-p[i][1])*(q[i+1][1]-q[i][1]),0);near(d.cross,cross);const qv=p.slice(1).reduce((s,z,i)=>s+(z[1]-p[i][1])**2+(q[i+1][1]-q[i][1])**2,0);near(d.actual-d.stochastic-d.drift,kind==='product'?cross:qv-2);}}
});
test('histograms preserve mass including explicit out-of-window counts',()=>{const d=H.histogram([-2,-1,0,.5,1,2],[-1,0,1]);assert.deepEqual(d.counts,[1,3]);assert.equal(d.outside,2);near(d.mass.reduce((a,b)=>a+b,0)+d.outside/6,1);});
test('PROB7 preserves all frozen identities and source flags, synchronizes metadata, and uses written prerequisites',async()=>{
 const plan=JSON.parse(await readFile(new URL('../docs/wave-6-plan.json',import.meta.url),'utf8')),{items}=await loadAll(),chapter=items.filter(x=>x.col==='prob'&&x.chapter===7),all=new Set(items.map(x=>x.id));
 const S=(await import('../content/prob/syllabus.js')).default.chapters.find(x=>x.n===7),frozen=plan.chapters.find(x=>x.col==='prob'||x.collection==='prob');assert.equal(chapter.length,43);
 for(const it of chapter){const s=S.items.find(x=>x.num===it.num),p=(frozen.items||frozen.newItems).find(x=>x.num===it.num||x.id===it.id);assert.equal(it.name,p.name);assert.equal(it.kind,p.kind);assert.equal(it.name,s.name);assert.equal(it.kind,s.kind);assert.deepEqual(it.deps,s.deps);assert.deepEqual(it.refs,s.refs);for(const dep of it.deps)assert.ok(all.has(dep),dep);assert.equal(typeof it.viz,'function');if(it.num.endsWith('a')){assert.equal(it.verify,true);assert.equal(s.verify,true);}}
});
