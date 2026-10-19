import test from'node:test';import assert from'node:assert/strict';import{fdHalf}from'../content/cm/ch04.shared.js';import{MATERIALS,KB_A,gapA,densityC,densityV,intrinsicA,fermiA,neutralityA,dopingRegime,impurityA,BAND_MODELS,absorptionA,indirectA,conductionA}from'../content/cm/cm-source-audit-carriers.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`),rel=(a,b,t=1e-6)=>near(a/b,1,t);
function simpson(f,a,b,n=4000){let sum=f(a)+f(b),h=(b-a)/n;for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3;}
const directFD=eta=>4/Math.sqrt(Math.PI)*simpson(u=>u*u*fermiA(u*u-eta),0,Math.sqrt(Math.max(eta,0)+60));
test('optical edge powers/Bose weights and actual indirect final states conserve energy across371energies×3models',()=>{
 for(const b of Object.values(BAND_MODELS))for(let j=0;j<=370;j++){const E=.3+j*.01,A=absorptionA(b,E),S=indirectA(b,E);near(A.total,A.direct+A.absorb+A.emit,1e-9);if(b.Ei){const n=1/Math.expm1(b.Ep/(KB_A*300));near(A.emit,b.Ai*Math.max(0,E-b.Ei-b.Ep)**2*(n+1),1e-8);near(A.absorb,b.Ai*Math.max(0,E-b.Ei+b.Ep)**2*n,1e-8);if(S){near(S.Ef-E,S.emission?-b.Ep:b.Ep);if(S.kf!==null){assert.ok(S.kf>=0&&S.kf<=1);near(conductionA(b.valleys[0],S.kf),S.Ef);}}else assert.ok(E<b.Ei-b.Ep);}else assert.equal(S,null);}
 // Independent convolution of two3Dparabolic densities gives indirect quadratic onset.
 for(const D of[.01,.1,1])rel(simpson(x=>Math.sqrt(x)*Math.sqrt(D-x),0,D),Math.PI*D*D/8,4e-6);
});
test('numerical FD interpolation against independent direct4,000panel integral and stable hole tails',()=>{
 for(let j=0;j<350;j++){const eta=-45+j*.28713;rel(fdHalf(eta),directFD(eta),8e-5);}assert.equal(1-fermiA(-80),0);assert.ok(fermiA(80)>0);rel(fermiA(80),Math.exp(-80),1e-15);
});
test('primary DOS values, equal intrinsic populations with both gap settings and analytic apparent gap correction',()=>{
 const tab={Si:[2.8e19,1.04e19],Ge:[1.04e19,6e18],GaAs:[4.7e17,7e18]};for(const m of Object.values(MATERIALS)){assert.equal(densityC(m,300),tab[m.name][0]);assert.equal(densityV(m,300),tab[m.name][1]);for(const T of[100,300,1000])for(const shrink of[false,true]){const E=gapA(m,shrink?T:300),S=neutralityA(m,T,0,0,0,E);rel(S.n,S.p,2e-12);const n0=intrinsicA(m,T,E),muB=E/2+KB_A*T*Math.log(densityV(m,T)/densityC(m,T))/2;rel(densityC(m,T)*Math.exp((muB-E)/(KB_A*T)),n0,2e-12);if(T===100)rel(S.n,n0,1e-6);const h=.00001/T,ln=x=>Math.log(intrinsicA(m,1/x,shrink?gapA(m,1/x):gapA(m,300))),app=-2*KB_A*(ln(1/T+h)-ln(1/T-h))/(2*h),EgPrime=shrink?-m.alpha*T*(T+2*m.beta)/(T+m.beta)**2:0;near(app,E-T*EgPrime+3*KB_A*T,2e-9);}}
});
test('charge neutrality across3materials×17temperatures×4donors×4acceptors; compensated samples not called intrinsic',()=>{
 for(const m of Object.values(MATERIALS))for(let j=0;j<=16;j++){const T=30*(1000/30)**(j/16);for(const Nd of[1e12,1e15,1e18,1e19])for(const Na of[1,1e12,1e16,1e18]){const c=neutralityA(m,T,Nd,Na);assert.ok(c.n>0&&c.p>0);assert.ok(c.ndp>=0&&c.ndp<=Nd);near(c.residual/(c.n+Na+c.p+c.ndp),0,5e-13);if(c.p>2*c.n)assert.match(dopingRegime(c,Nd,Na),/acceptor/);}}
});
test('hydrogenic energy/radius scaling, finite-model validity and integrated1s radial probability',()=>{
 for(const m of[.03,.068,.12,.26,1.2])for(const eps of[4,12,16.2,40])for(const T of[4,100,400]){const S=impurityA(m,eps,.543,T);near(S.Ed*S.aB,13.605693122990*.0529177210544/eps,1e-12);rel(S.nat,4*Math.PI*S.aB**3/3*8/.543**3,1e-14);assert.equal(S.valid,S.aB/.543>=5);}
 near(simpson(r=>4*r*r*Math.exp(-2*r),0,1),1-5*Math.exp(-2),1e-12);
});
