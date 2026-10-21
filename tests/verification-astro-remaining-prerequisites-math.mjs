// Independent local mathematical witnesses, without production helper imports.
import assert from'node:assert/strict';let checks=0,groups=0;const ok=x=>{checks++;assert.ok(x)},near=(a,b,e=1e-10)=>ok(Math.abs(a-b)<e*(1+Math.abs(b)));
// J2 average in true anomaly: exact trapezoidal quadrature for these finite harmonics.
for(const e of[0,.01,.2,.5,.8])for(const i of[0,.2,.7,Math.PI/2,2,Math.PI])for(let j=0;j<13;j++){const omega=j*.37,N=128;let A=0,B=0,C=0;for(let k=0;k<N;k++){const f=2*Math.PI*k/N,w=1+e*Math.cos(f),s=Math.sin(f+omega);A+=s*s/N;B+=Math.cos(f)*s*s/N;C+=w*(1.5*Math.sin(i)**2*s*s-.5)/N;}near(A,.5);near(B,0);near(C,.75*Math.sin(i)**2-.5);const eps=1e-5,F=x=>.75*Math.sin(x)**2-.5;near((F(i+eps)-F(i-eps))/(2*eps),1.5*Math.sin(i)*Math.cos(i),1e-9);}groups++;
// The full Kepler time-weighted r^-3 average: no unweighted true-anomaly average shortcut.
for(const e of[0,.1,.4,.7])for(const a of[.7,1,4])for(const inc of[.1,.9,1.8]){let sum=0;const N=512;for(let j=0;j<N;j++){const f=2*Math.PI*j/N,r=a*(1-e*e)/(1+e*Math.cos(f)),dM=(1-e*e)**1.5/(1+e*Math.cos(f))**2;sum+=r**-3*(1.5*Math.sin(inc)**2*Math.sin(f+.73)**2-.5)*dM/N;}near(sum,(.75*Math.sin(inc)**2-.5)/(a**3*(1-e*e)**1.5));}groups++;
// Taylor linear coefficient and a uniform Lagrange-remainder bound away from the star.
for(const a of[.5,1,3])for(const GM of[.1,1,7])for(let j=-100;j<=100;j++){const x=a*j/1000,n2=GM/a**3,actual=-GM/(a+x)**2+n2*(a+x),linear=3*n2*x,bound=3*GM*x*x/(.9*a)**4;ok(Math.abs(actual-linear)<=bound+1e-12);if(x)ok(Math.sign(actual)===Math.sign(x));}for(const massRatio of[1e-12,1e-9,1e-6,.001]){const h=(massRatio/3)**(1/3);near(massRatio/(h*h),3*h);ok(h<.1);}groups++;
// Finite additivity over disjoint equal-energy states and cancellation of a common normalization.
for(let g0=1;g0<=12;g0++)for(let g1=1;g1<=12;g1++)for(const gap of[0,.1,1,8])for(const T of[.2,1,5]){const u=Math.exp(-gap/T),Z=g0+g1*u;let P0=0,P1=0;for(let j=0;j<g0;j++)P0+=1/Z;for(let j=0;j<g1;j++)P1+=u/Z;near(P0+P1,1);near(P1/P0,(g1/g0)*u);near(P1,g1*u/Z);}groups++;
// Topological separation witness: a continuous scalar coordinate cannot connect these allowed pieces.
// P(x)=(x²-1)² is zero at ±1 and positive at0; sublevel c<1 has two disjoint intervals.
for(const c of[.01,.1,.3,.7,.99]){const inner=Math.sqrt(1-Math.sqrt(c)),outer=Math.sqrt(1+Math.sqrt(c));ok(inner>0&&inner<outer);near((inner*inner-1)**2,c);near((outer*outer-1)**2,c);ok(1>c);for(let j=-9;j<=9;j++){const x=inner*j/10;ok((x*x-1)**2>c);} // Any continuous path from negative to positive must attain forbidden0.
}groups++;console.log({groups,checks,productionHelpersImported:false});
