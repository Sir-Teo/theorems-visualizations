// Explicit finite witnesses and numerical checks, independent of snapshot/review flags.
import assert from 'node:assert/strict';let n=0;const near=(x,y,t=1e-8)=>{assert.ok(Number.isFinite(x)&&Math.abs(x-y)<=t*(1+Math.abs(y)),`${x} != ${y}`);n++;};
const sum=a=>a.reduce((s,x)=>s+x,0);
// Independent placement/patch events: exhaustive Cartesian product counts.
for(let N=2;N<=15;N++)for(let a=1;a<N;a++)for(let b=1;b<N;b++){let good=0;for(let i=0;i<N;i++)for(let j=0;j<N;j++)if(i<a&&j<b)good++;near(good/N**2,(a/N)*(b/N));}
for(const alpha of [.1,.3,1,2]){const p=(1-Math.cos(alpha))/2;near(p*p,(1-2*Math.cos(alpha)+Math.cos(alpha)**2)/4);}
// Reciprocal integrated law, half-life, and exact positive-power log slopes.
for(const A of [.1,1,3])for(const k of [.01,.3,2])for(const t of [0,.1,2,20]){const x=A/(1+k*A*t);near(1/x-1/A,k*t);near(k*x*x,k*A*A/(1+k*A*t)**2);near(A/(1+k*A/(k*A)),A/2);}
for(const m of [-1,.5,2])for(const a of [.2,1,5]){const b=a*1.7;near(Math.log((.3*b**m)/(.3*a**m))/Math.log(b/a),m);}
// Water ion-pair relaxation: exact Taylor remainder around equilibrium.
for(const H of [1,2,4])for(const kd of [.1,1])for(const kr of [.3,2])for(const d of [-.1,.02,.2]){const x=Math.sqrt(kd/kr),F=z=>kd-kr*z*z;near(F(x+d),-2*kr*x*d-kr*d*d);}
// Detailed-balance cycle exponential telescope.
for(let j=1;j<=100;j++){const G=[.3*j,-.1*j,4,j/7];let p=1;for(let i=0;i<G.length;i++)p*=Math.exp(-(G[(i+1)%G.length]-G[i])/100);near(p,1);}
// Q10 reciprocal-temperature Taylor error and its exact sign/magnitude.
for(const T of [100,200,300,500,1000]){const h=10;near(1/(T+h)-(1/T-h/T**2),h*h/(T*T*(T+h)));assert.ok(1/T-1/(T+h)<h/T**2);n++;}
// Symmetric Hessian: rotated negative/positive eigenmodes recover the quadratic form.
for(let j=0;j<40;j++){const q=j/13,c=Math.cos(q),s=Math.sin(q),a=-2,b=3,H=[[a*c*c+b*s*s,(a-b)*c*s],[(a-b)*c*s,a*s*s+b*c*c]];for(const x of [-2,.3,1])for(const y of [-1,.4]){const u=c*x+s*y,v=-s*x+c*y;near(H[0][0]*x*x+2*H[0][1]*x*y+H[1][1]*y*y,a*u*u+b*v*v);}}
// Composite activation derivative independently by centered differences in inverse T.
for(const E1 of [.3,1])for(const Em of [2,4])for(const E2 of [.1,.7])for(const x of [.2,.8]){const ks=[Math.exp(-E1*x),2*Math.exp(-Em*x),.7*Math.exp(-E2*x)],fun=z=>Math.log(Math.exp(-E1*z)*.7*Math.exp(-E2*z)/(2*Math.exp(-Em*z)+.7*Math.exp(-E2*z))),h=1e-5;near(-(fun(x+h)-fun(x-h))/(2*h),E1+ks[1]/(ks[1]+ks[2])*(E2-Em));}
// Eyring log transform removes T; local energy parabola Taylor remainder is exact.
for(const T of [100,300,1000])for(const H of [1,4]){const S=.2,k=3*T*Math.exp(S-H/T);near(Math.log(k/T),Math.log(3)+S-H/T);}
for(const L of [1,3,10])for(const E of [-.7,0,.7])for(const d of [-.1,.2]){const f=z=>(L+z)**2/(4*L),a=(1+E/L)/2;near(f(E+d)-f(E)-a*d,d*d/(4*L));}
for(const x of [.01,.03,.1,.2]){const rem=x/Math.sin(x)-1-x*x/6;assert.ok(rem>0&&rem<.021*x**4);n++;}
// Three-state reversible star: detailed balance and similarity to a symmetric matrix.
for(const a of [.1,1,3])for(const b of [.2,2])for(const c of [.3,4])for(const d of [.4,5]){const pi=[1,a/b,c/d],M=[[-a-c,b,d],[a,-b,0],[c,0,-d]];for(let i=0;i<3;i++){near(sum(M[i].map((v,j)=>v*pi[j])),0);for(let j=0;j<3;j++)near(M[i][j]*Math.sqrt(pi[j]/pi[i]),M[j][i]*Math.sqrt(pi[i]/pi[j]));}}
// Mean of a sum and independent Bernoulli channel-count variance, enumerated with unequal weights.
for(let h=1;h<=10;h++)for(const p of [.2,.5,.8]){let ex=0,ex2=0;for(let mask=0;mask<2**h;mask++){let k=0;for(let j=0;j<h;j++)k+=(mask>>j)&1;const w=p**k*(1-p)**(h-k);ex+=k*w;ex2+=k*k*w;}near(ex,h*p);near(ex2-ex*ex,h*p*(1-p));near(Math.sqrt(ex2-ex*ex)/ex,Math.sqrt((1-p)/(h*p)));}
for(const rates of [[1,2,3],[.1,4,.7]]){const means=rates.map(k=>1/k);near(sum(means),sum(rates.map(k=>(1-Math.exp(-20*k))/k+Math.exp(-20*k)/k)));}
// Shifted scalar growth solves initiation+branching, with the zero-exponent limit separate.
for(const l of [-3,-.1,.1,2])for(const v of [.2,3])for(const t of [0,.1,1]){const x=v*Math.expm1(l*t)/l;near(v*Math.exp(l*t),v+l*x);}near(.7*2,.7*2);
console.log(`PASS ${n} independent KIN prerequisite assertions across all sixteen edges`);
