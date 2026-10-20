// Independent review mathematics: no production code or constants imported.
import assert from 'node:assert/strict';
let checks=0;const ok=x=>{assert.ok(x);checks++;},near=(a,b,t=1e-9)=>ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)));const simpson=(f,a,b,n=4000)=>{let s=f(a)+f(b);for(let i=1;i<n;i++)s+=(i%2?4:2)*f(a+(b-a)*i/n);return s*(b-a)/(3*n);};
// Independent exponential survival products, waiting-time mean, and parallel-channel failure.
for(const a of [.1,.5,1,3])for(const b of [.2,1,4]){for(const t of[0,.1,1,2,5])near(Math.exp(-a*t)*Math.exp(-b*t),Math.exp(-(a+b)*t));near(simpson(t=>Math.exp(-(a+b)*t),0,30/(a+b)),1/(a+b),1e-9);}ok(1/(1/2+1/3)!==2+3);
// Uniform Taylor remainder bound on each compact positive-energy interval.
for(const ef of[.2,1,4,20])for(const ratio of[-.4,-.1,-.01,.01,.1,.4]){const d=ef*ratio,err=(ef+d)**1.5-ef**1.5-1.5*Math.sqrt(ef)*d,bound=.5*.75/Math.sqrt(Math.min(ef,ef+d))*d*d;ok(err>=-1e-12);ok(err<=bound+1e-11);}
// Mass-weighted diatomic block: trace/determinant, direct eigenvector residual, positivity.
for(const m of[.1,1,3])for(const M of[.2,2,10])for(const K of[.3,1,4])for(let j=0;j<=32;j++){const k=Math.PI*j/32,a=2*K/m,d=2*K/M,b=-2*K*Math.cos(k/2)/Math.sqrt(m*M),disc=Math.hypot(a-d,2*b),lo=(a+d-disc)/2,hi=(a+d+disc)/2;near(lo+hi,a+d);near(lo*hi,4*K*K*Math.sin(k/2)**2/(m*M),1e-8);ok(lo>=-1e-10);for(const l of[lo,hi]){const v=Math.abs(b)>1e-10?[b,l-a]:Math.abs(l-a)<Math.abs(l-d)?[1,0]:[0,1];near(a*v[0]+b*v[1],l*v[0],1e-8);near(b*v[0]+d*v[1],l*v[1],1e-8);}}
// Hermitian complex block has real nonnegative eigenvalues; translation nullity need not be exactly3.
for(const a of[1,2,5])for(const b of[.1,.5])for(const phase of[0,.3,1,2]){const re=b*Math.cos(phase),im=b*Math.sin(phase),l1=a-b,l2=a+b;near(re*re+im*im,b*b);near(l1+l2,2*a);near(l1*l2,a*a-b*b);ok(l1>=0);}const eigenvalues=[0,0,0,0,1,2];ok(eigenvalues.filter(x=>x===0).length>3);
// Finite normalized-measure Jensen bound including explicit F0 sign.
for(let n=2;n<=10;n++)for(let seed=1;seed<=20;seed++){const weights=Array.from({length:n},(_,j)=>1+(j*seed%7)),z=weights.reduce((s,x)=>s+x,0),s=weights.map((_,j)=>Math.sin(j+seed)*4);const mean=s.reduce((v,x,j)=>v+weights[j]/z*x,0),e=s.reduce((v,x,j)=>v+weights[j]/z*Math.exp(-x),0);ok(Math.log(e)>=-mean-1e-12);const beta=.3+seed/10,F0=2,F=F0-Math.log(e)/beta;ok(F<=F0+mean/beta+1e-12);}
// MCT nonnegative truncations and finite nonzero limit, verified by series-integral independent quadrature.
const f=x=>x===0?0:x**5*Math.exp(-x)/(-Math.expm1(-x))**2;const tails=[1,2,4,8,16,32,64].map(L=>simpson(f,0,L,8000));for(let j=1;j<tails.length;j++)ok(tails[j]>=tails[j-1]);let zeta5=0;for(let n=1;n<=10000;n++)zeta5+=1/n**5;near(tails.at(-1),120*zeta5,1e-8);ok(tails.at(-1)>0);for(const r of[1/3,1,3,10,30]){const scaled=r**5*simpson(f,0,1/r);ok(scaled>0);if(r>=10)near(scaled/r,.25,.001);}
// DOS integral: substitute epsilon=t², compare Gamma(3/2) scaling and normalized Nc.
for(const temp of[.1,.5,1,3,10]){const integral=simpson(t=>2*t*t*Math.exp(-t*t/temp),0,10*Math.sqrt(temp));near(integral,Math.sqrt(Math.PI)/2*temp**1.5,1e-9);for(const mass of[.2,1,4]){const dosPref=1/(2*Math.PI**2)*(2*mass)**1.5;near(dosPref*integral,2*(mass*temp/(2*Math.PI))**1.5);}}
// Decaying constant-coefficient minority profile and signed edge excess.
for(const D of[.1,1,10])for(const tau of[.2,2,5])for(const edge of[-3,0,2]){const L=Math.sqrt(D*tau);for(const x of[0,.1,1,5]){const u=edge*Math.exp(-x/L),ux=-u/L,uxx=u/(L*L);near(D*uxx-u/tau,0);near(-D*ux,D*edge/L*Math.exp(-x/L));}near(edge*Math.exp(-0/L),edge);}
// ABC exact derivative sign, balance peak, monotone current and arbitrarily small optimum.
for(const A of[.01,1,100])for(const B of[.0001,.2,3,100])for(const C of[.001,1,20]){const n0=Math.sqrt(A/C),eta=n=>B*n/(A+B*n+C*n*n),peak=B/(B+2*Math.sqrt(A*C));near(eta(n0),peak);for(const q of[.01,.2,.9,1,1.1,2,10,100]){const n=q*n0;ok(A+2*B*n+3*C*n*n>0);ok(eta(n)<=peak+1e-12);near((B*(A+C*n*n)-B*n*(2*C*n))/(A+B*n+C*n*n)**2,B*(A-C*n*n)/(A+B*n+C*n*n)**2);if(q!==1)ok(Math.sign(A-C*n*n)===Math.sign(1-q));}near(A*n0,C*n0**3);}
ok(.0001/(.0001+2)<.0001);
const lowCrossoverRatio=4*(1/3)**4*simpson(f,0,3);near(lowCrossoverRatio,.6306448242490921,1e-10);ok(lowCrossoverRatio<.64);near(4*10**4*simpson(f,0,.1),.9994446527116602,1e-10);ok(1!==1/(1+1/2)); // deterministic waits1,2 have min1, not inverse summed mean rates.
console.log(JSON.stringify({groups:9,independentChecks:checks,productionImports:false,pass:true}));
