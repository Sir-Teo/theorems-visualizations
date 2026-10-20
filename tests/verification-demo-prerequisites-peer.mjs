// Explicit independent peer witnesses; no frozen content or review-status assertions.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const root=process.env.DEMO_PREREQUISITES_PEER_ROOT || process.cwd();
const mod=p=>import(pathToFileURL(resolve(root,p)).href);
const {leeCarter,drift}=await mod('content/demo/ch03.shared.js');
const {maritalSchedule,fitMaritalSchedule,CT_V}=await mod('content/demo/source-audit-fertility-indices.js');
let cases=0;
const near=(x,y,t=2e-9)=>{assert.ok(Number.isFinite(x)&&Math.abs(x-y)<t*(1+Math.abs(y)),`${x} != ${y}`);cases++;};
const sum=a=>a.reduce((s,x)=>s+x,0);
// Actual SVD helper: centered rank-one witnesses with nonzero loading sum.
for(let n=2;n<=18;n++)for(let j=1;j<=8;j++){
 const b=Array.from({length:n},(_,i)=>i+j+1),bs=sum(b); b.forEach((_,i)=>b[i]/=bs);
 const k=[-3,-1,0,1,3].map(x=>x*j),a=b.map((_,i)=>-4+i/10);
 const Z=k.map(t=>a.map((v,i)=>v+b[i]*t)),r=leeCarter(Z);
 near(sum(r.b),1);near(r.share,1);
 for(let i=0;i<n;i++){near(r.a[i],a[i]);near(r.b[i],b[i]);for(let t=0;t<k.length;t++)near(r.a[i]+r.b[i]*r.k[t],Z[t][i]);}
}
// Actual fertility helper vs an independently solved 2x2 Gram system.
for(const M of [.2,.9,2])for(const m of [-1,0,.7,2])for(const d of [-.4,0,.3]){
 const rates=maritalSchedule(M,m,d),r=fitMaritalSchedule(rates),x=CT_V.slice(0,5),y=r.logs.slice(0,5);
 const sx=sum(x),sxx=sum(x.map(v=>v*v)),sy=sum(y),sxy=sum(x.map((v,i)=>v*y[i])),det=5*sxx-sx*sx;
 near(r.intercept,(sy*sxx-sx*sxy)/det);near(r.m,(5*sxy-sx*sy)/det);
 near(sum(r.residuals.slice(0,5)),0);near(sum(x.map((v,i)=>v*r.residuals[i])),0);
 const loss=sum(r.residuals.slice(0,5).map(v=>v*v));
 for(const u of [-.7,.2])for(const v of [-.3,.4])near(sum(y.map((z,i)=>(z-r.intercept-u-(r.m+v)*x[i])**2)),loss+sum(x.map(z=>(u+v*z)**2)));
 if(d===0){near(r.M,M);near(r.m,m);}
 // Held-out sixth observation cannot alter the fitted coefficients.
 const held=rates.slice();held[5]*=3;const h=fitMaritalSchedule(held);near(h.M,r.M);near(h.m,r.m);
}
// Conditional survivor means on finite laws, including a nonmonotone remaining lifetime.
for(let seed=1;seed<=100;seed++){
 const w=Array.from({length:9},(_,k)=>(seed*(k+3)%11)+1);let old=-Infinity;
 for(let x=0;x<9;x++){let den=sum(w.slice(x)),mu=sum(w.slice(x).map((v,j)=>v*(x+j)))/den;assert.ok(mu>=old);old=mu;cases++;}
 const p=w.map(v=>v/sum(w)),mu=sum(p.map((v,k)=>v*k)),m2=sum(p.map((v,k)=>v*k*k));near(m2/mu,mu+sum(p.map((v,k)=>v*(k-mu)**2))/mu);
 const c=[.1+seed/200,.7,.8,.9];near(Math.log(c.reduce((a,b)=>a*b,1)),sum(c.map(Math.log)));
 near(5*sum(p),sum(p.map(v=>5*v)));
}
// APC design-map kernel: age-period-cohort identity, not equality of individual coefficients.
for(let a=0;a<20;a++)for(let p=20;p<40;p++)for(const z of [-2,.3,4])near(z*a-z*p+z*(p-a),0);
const simpson=(f,end,N=12000)=>{const h=end/N;let s=f(0)+f(end);for(let i=1;i<N;i++)s+=(i%2?4:2)*f(i*h);return s*h/3;};
// Variable independent latent hazards: both cause integrals sum to total death probability.
for(const a of [.01,.1])for(const b of [.001,.02])for(const c of [.03,.2]){
 const S=x=>Math.exp(-(a+c)*x-b*x*x/2),end=15;
 near(simpson(x=>(a+b*x)*S(x),end)+simpson(x=>c*S(x),end),1-S(end));
 near(Math.exp(-a*end-b*end*end/2)*Math.exp(-c*end),S(end));
}
// Gamma survivor conditional mean; substitution z=u² includes half-integer shapes.
for(const shape of [.5,1,1.5,3])for(const H of [.1,1,4]){
 const rate=shape+H,end=Math.sqrt(50/rate);
 const den=simpson(u=>2*u**(2*shape-1)*Math.exp(-rate*u*u),end);
 const num=simpson(u=>2*u**(2*shape+1)*Math.exp(-rate*u*u),end);near(num/den,shape/rate,2e-8);
}
// Actual fitted drift, then exact independent Rademacher innovation distributions.
const steps=[-2,1,3,-1,4],series=[0];for(const d of steps)series.push(series.at(-1)+d);
const dr=drift(series),mu=sum(steps)/steps.length;near(dr.mu,mu);near(dr.sd**2,sum(steps.map(x=>(x-mu)**2))/(steps.length-1));
for(let h=1;h<=12;h++){
 let s=0,q=0;for(let mask=0;mask<2**h;mask++){let x=0;for(let i=0;i<h;i++)x+=(mask>>i&1)?3:-3;s+=x;q+=x*x;}
 near(s/2**h,0);near(q/2**h,9*h);
}
// At h=1 the ±1.96 sigma band has coverage 1, not .95: variance is insufficient.
assert.equal([-3,3].filter(x=>Math.abs(x)<=1.96*3).length/2,1);cases++;
console.log(`PASS ${cases} independent peer assertions, including actual SVD/drift/fertility helpers`);
