import test from'node:test';import assert from'node:assert/strict';import{debyeIntegral,debyeRatio,meltingThreshold,dielectric,reflectivity,polariton,feynmanFunctional,feynmanAudit,edgeDisplacement,slipStress}from'../content/cm/cm-source-audit-phonons.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
function simpson(f,a,b,n=20000){const h=(b-a)/n;let sum=f(a)+f(b);for(let i=1;i<n;i++)sum+=(i%2?4:2)*f(a+i*h);return sum*h/3;}
test('Debye series against independent direct integral; total3D normalization/zero/classical limits',()=>{
 for(const X of[.0001,.1,.9,1,2,10,50])near(debyeIntegral(X),simpson(x=>x===0?1:x/Math.expm1(x),0,X),2e-12);
 for(const eta of[.002,.008,.05]){near(debyeRatio(0,eta)**2,eta/4);for(const t of[.001,.01,.1,1,10,100]){const rms=debyeRatio(t,eta);assert.ok(rms**2>=eta*t-1e-13);if(t>=100)near(rms**2/(eta*t),1,3e-6);}}
});
test('all49×41Lindemann control pairs: positive crossing or true zero-point threshold failure',()=>{
 for(let i=0;i<49;i++)for(let j=0;j<=40;j++){const eta=.002+i*.001,c=.05+j*.005,T=meltingThreshold(eta,c);if(c<=Math.sqrt(eta)/2)assert.equal(T,null);else{assert.ok(T>0);near(debyeRatio(T,eta),c,1e-12);assert.ok(T<=c*c/eta+1e-12);}}
});
test('passive Lorentz response, LST zero, Fresnel limits and exact polariton polynomial/edges',()=>{
 for(const Ei of[1,2.25,8])for(const delta of[.05,1,3.65,18]){const Es=Ei+delta,wl=Math.sqrt(Es/Ei);near(dielectric(0,Es,Ei,0)[0],Es);near(dielectric(wl,Es,Ei,0)[0],0,3e-10);near(reflectivity(0,Es,Ei,0),((Math.sqrt(Es)-1)/(Math.sqrt(Es)+1))**2);near(reflectivity(1,Es,Ei,0),1);
 for(let j=0;j<=400;j++){const q=j/100,p=polariton(q,Es,Ei);for(const w of[p.lower,p.upper])near(Ei*w**4-(q*q+Es)*w*w+q*q,0,2e-12);assert.ok(p.lower<1&&p.upper>=wl-1e-12);}
 for(const g of[0,.02,.25])for(let j=0;j<=400;j++){const w=j/100,R=reflectivity(w,Es,Ei,g);assert.ok(R>=0&&R<=1+1e-12);if(g>0)assert.ok(dielectric(w,Es,Ei,g)[1]>=0);if(g===0&&w>1&&w<wl)near(R,1);}}
});
test('Feynman original functional endpoint and independent quadrature; effective/trial masses distinguished',()=>{
 // Independent integration in original tau variable with midpoint quadrature in sqrt(tau).
 for(const a of[.5,1,3,6,9,12]){const F=feynmanAudit(a),U=Math.sqrt(50);const cov=t=>(F.w**2*t+(F.v*F.v-F.w*F.w)/F.v*(-Math.expm1(-F.v*t)))/(F.v*F.v);const I=simpson(u=>u===0?2:2*u*Math.exp(-u*u)/Math.sqrt(cov(u*u)),0,U);const M=simpson(u=>u===0?0:2*u**5*Math.exp(-u*u)/cov(u*u)**1.5,0,U);near(F.E,.75*(F.v-F.w)**2/F.v-a*I/Math.sqrt(Math.PI),3e-9);near(F.effectiveMass,1+a*M/(3*Math.sqrt(Math.PI)),1e-8);assert.ok(F.E<-a);assert.ok(F.effectiveMass>1&&F.trialMass>1);assert.ok(Math.abs(F.effectiveMass-F.trialMass)>.005);for(const dv of[.99,1.01])for(const dw of[.99,1.01])assert.ok(feynmanFunctional(a,F.v*dv,F.w*dw)>=F.E-1e-8);}
 for(const w of[.2,1,3,15])near(feynmanFunctional(2,w,w),-2,1e-12);
 const weak=feynmanAudit(.01);near(-(weak.E+.01)/.01**2,1/81,1e-5);near((weak.effectiveMass-1)/.01,1/6,.0003);
});
test('isotropic edge field, Burgers discontinuity, derivative scaling and stated Peierls width convention',()=>{
 for(const nu of[0,.3,.45])for(const x of[-4,-1,1,4])for(const y of[-3,-.5,.5,3]){const [ux,uy]=edgeDisplacement(x,y,0,nu),r2=x*x+y*y;near(ux,(Math.atan2(y,x)+x*y/(2*(1-nu)*r2))/(2*Math.PI));near(uy,-((1-2*nu)*Math.log(r2)/(4*(1-nu))+(x*x-y*y)/(4*(1-nu)*r2))/(2*Math.PI));const d=1e-5,d1=(edgeDisplacement(x+d,y,0,nu)[0]-edgeDisplacement(x-d,y,0,nu)[0])/(2*d),d2=(edgeDisplacement(2*x+d,2*y,0,nu)[0]-edgeDisplacement(2*x-d,2*y,0,nu)[0])/(2*d);near(d1,2*d2,2e-10);}
 near(edgeDisplacement(-3,1e-9,0,.3)[0]-edgeDisplacement(-3,-1e-9,0,.3)[0],1,1e-9);
 for(let i=0;i<=100;i++){const nu=.45*i/100;for(const W of[.3,1.2,4]){const S=slipStress(nu,W,.25);near(S.current,S.ideal);near(S.pn,8/(4*(1-nu))*Math.exp(-4*Math.PI*(W/2)),1e-15);near(slipStress(nu,W,1).current,0,1e-15);}}
});
