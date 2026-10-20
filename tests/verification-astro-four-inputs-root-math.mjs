// Independent root witnesses for four proposed ASTRO proof inputs; explicit-only.
import assert from 'node:assert/strict';
let checks=0; const groups=[];
const near=(a,b,t=2e-10)=>{checks++;assert.ok(Math.abs(a-b)<=t*(1+Math.abs(b)),`${a} != ${b}`);};
const ok=x=>{checks++;assert.ok(x);};
const average=(f,n)=>{let s=0;for(let k=0;k<n;k++)s+=f(2*Math.PI*k/n);return s/n;};
// Finite harmonics, not convergence of an infinite Fourier series.
for(const e of [0,.1,.5,.8])for(const inc of [0,.3,1,Math.PI/2,2.4])for(const omega of [0,.2,1.7,3]){
 const P=f=>(3*Math.sin(inc)**2*Math.sin(omega+f)**2-1)/2;
 const expected=3*Math.sin(inc)**2/4-.5;
 near(average(f=>(1+e*Math.cos(f))*P(f),64),expected);
 // Independently integrate potential against Kepler's areal time weight.
 const a=2.3,p=a*(1-e*e),r=f=>p/(1+e*Math.cos(f));
 const timeMean=average(f=>P(f)/r(f),4096)/average(f=>r(f)**2,4096);
 near(timeMean,expected/(a**3*(1-e*e)**1.5));
}
groups.push('finite harmonic and areal-weighted quadrupole means');
const bisect=(f,l,r)=>{let a=f(l),b=f(r);assert.ok(a*b<0);for(let k=0;k<100;k++){const m=(l+r)/2,v=f(m);if(v===0)return m;if(a*v>0){l=m;a=v;}else{r=m;b=v;}}return(l+r)/2;};
for(const mu of [.001,.01,.1,.3,.49,.5]){
 const d=x=>x-(1-mu)*(x+mu)/Math.abs(x+mu)**3-mu*(x-1+mu)/Math.abs(x-1+mu)**3;
 const critical=x=>x*x+2*((1-mu)/Math.abs(x+mu)+mu/Math.abs(x-1+mu));
 const L1=bisect(d,-mu+1e-8,1-mu-1e-8),L2=bisect(d,1-mu+1e-8,5),L3=bisect(d,-5,-mu-1e-8);
 const C=[L1,L2,L3].map(critical),triangular=3-mu+mu*mu;
 ok(C[0]>C[1]);ok(C[2]>triangular);
 if(mu<.5)ok(C[1]>C[2]);else near(C[1],C[2]);
}
// An interval's continuous image cannot span two separated allowed components.
// The exact IVT witness supplements (and does not replace) the connected-image proof.
for(let k=1;k<=100;k++){const start=-1-k/100,end=1+k/100,t=-start/(end-start);near(start+(end-start)*t,0);ok(t>0&&t<1);}
groups.push('collision-free connected images and equal-mass critical-value symmetry');
for(const x of [-.1,-.05,-.01,-.001,-1e-4,1e-4,.001,.01,.05,.1]){
 const exactStar=1-1/(1+x)**2,residual=exactStar-2*x;
 ok(Math.abs(residual)<=3*x*x/(1-Math.abs(x))**4+1e-15);
 near((exactStar+x)-3*x,residual);
}
for(const ratio of [1e-12,1e-9,1e-6,1e-3]){
 const hill=Math.cbrt(ratio/3);
 near(3*hill,ratio/hill**2);
 const exact=r=>r+1-1/(1+r)**2-ratio/r**2;
 const root=bisect(exact,hill/2,2*hill);
 ok(Math.abs(root/hill-1)<hill); // a bounded small-ratio witness, not an exact Hill radius.
}
groups.push('inverse-square Taylor remainder and leading Hill balance');
for(const count of [2,3,5,10])for(const kT of [.2,.8,2,10]){
 const states=[];for(let n=1;n<=count;n++)for(let j=0;j<2*n*n;j++)states.push({n,weight:Math.exp(-13.6*(1-1/n**2)/kT)});
 const Z=states.reduce((s,x)=>s+x.weight,0);
 const probs=Array.from({length:count},(_,i)=>states.filter(s=>s.n===i+1).reduce((sum,x)=>sum+x.weight/Z,0));
 near(probs.reduce((s,x)=>s+x,0),1);
 for(let n=2;n<=count;n++)near(probs[n-1]/probs[0],n*n*Math.exp(-13.6*(1-1/n**2)/kT));
}
const A=new Set([0,1]),B=new Set([1,2]);ok(new Set([...A,...B]).size!==A.size+B.size);
groups.push('finite disjoint microstate events and degeneracy ratios');
console.log(JSON.stringify({checks,groups,scope:'Independent finite/numerical witnesses and explicit analytic hypotheses; no source closure or native acceptance'}));
