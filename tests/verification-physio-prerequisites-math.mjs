// Explicit producer mathematical checks, independent of production helper implementations.
import assert from 'node:assert/strict';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`),der=(f,x)=>{const h=(Math.abs(x)||1)*1e-5;return(f(x+h)-f(x-h))/(2*h);};let groups=0;
for(const K of[0,.2,2,33])for(const D of[-75,1,100]){const E=D/(1+K);near(E,D-K*E);near((E-D)/E,-K);}groups++;
for(const K of[.3,1,5])for(const D of[.1,2])for(const L of[.2,3])for(const c1 of[1,10]){const c2=.4,c=x=>K*c1+K*(c2-c1)*x/L,j=-D*der(c,L/2);near(j,D*K*(c1-c2)/L);near(c(L)-c(0),K*(c2-c1));}groups++;
for(const xs of[1e-6,1e-4,.01]){const exact=-Math.log1p(-xs);assert.ok(exact>=xs);assert.ok(exact-xs<=xs*xs/(2*(1-xs)));}groups++;
for(const alpha of[.02,.1,.25,1,4]){const v=x=>(1-x)/(x+alpha),P=x=>x*v(x),xstar=Math.sqrt(alpha*(1+alpha))-alpha;near(der(P,xstar),0,1e-8);assert.ok(xstar>0&&xstar<1);for(const s of[.01,.3,.9,1.2,2]){const x=xstar*s;if(x>1)continue;assert.ok(P(x)<=P(xstar)+1e-12);}near(P(0),0);near(P(1),0);}groups++;
for(const R of[1,3,10])for(const I of[.2,1,8]){near(I*R/R,I);assert.ok(I*2*R>I*R);}groups++;
// Counter-clockwise rectangle: filling right at low P, contraction up, ejection left at high P.
const loop=[[50,5],[120,5],[120,100],[50,100],[50,5]];let int=0,area=0;for(let i=1;i<loop.length;i++){const[a,p]=loop[i-1],[b,q]=loop[i];int+=(p+q)/2*(b-a);area+=(a*q-b*p)/2;}near(-int,area);assert.ok(area>0);groups++;
for(const r of[.1,1,3])for(const pressure of[1,10]){const mu=.7,L=4,u=x=>pressure*(r*r-x*x)/(4*mu*L),N=20000,h=r/N;let Q=0;for(let j=0;j<N;j++){const x=(j+.5)*h;Q+=2*Math.PI*x*u(x)*h;}near(Q,Math.PI*r**4*pressure/(8*mu*L),2e-9);near(der(u,r/2),-pressure*r/(4*mu*L));}groups++;
for(const r of[.1,1,10]){const Q=x=>3*x**4;near(r*der(Q,r)/Q(r),4);near(Q(2*r)/Q(r),16);}groups++;
for(const P of[0,10,100]){const V=x=>200+30*20*(1-Math.exp(-x/20));near(der(V,P),30*Math.exp(-P/20),2e-8);}groups++;
// Periodic pressure with prescribed Q=C P'+P/R verifies storage cancellation exactly.
for(const C of[.5,2])for(const R of[1,3]){const T=2,N=20000,h=T/N,P=t=>80+10*Math.sin(Math.PI*t),Q=t=>C*10*Math.PI*Math.cos(Math.PI*t)+P(t)/R;let meanP=0,meanQ=0;for(let j=0;j<N;j++){const t=(j+.5)*h;meanP+=P(t)/N;meanQ+=Q(t)/N;}near(meanP,R*meanQ);const diastole=t=>100*Math.exp(-t/(R*C));near(C*der(diastole,.7),-diastole(.7)/R);}groups++;
// Chosen oedema laws: continuous at pressure kink, strictly decreasing net, finite bracket.
for(const pc of[17.3,25.3,41.3])for(const pi of[10,25])for(const lymph of[0,1])for(const sigma of[0,1]){const tissue=x=>x<1.5?-3+2*x:.3*(x-1.5),f=x=>7*(pc-tissue(x)-sigma*(pi-96/(12+x)))-lymph*(2.1+50.4*(1-Math.exp(-(tissue(x)+3)/3)));near(tissue(1.5),0);let previous=f(0);for(let i=1;i<=100;i++){const now=f(i);assert.ok(now<previous);previous=now;}if(f(0)>0){let hi=1;while(f(hi)>0)hi*=2;assert.ok(Number.isFinite(hi));let lo=0;for(let j=0;j<60;j++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}near(f((lo+hi)/2),0,1e-8);}}groups++;
for(const gain of[0,.3,1])for(const passive of[.2,1,4]){const Q=x=>x**(1-gain);near(passive*der(Q,passive)/Q(passive),1-gain);const radius=P=>P**(-.25);near(passive*der(radius,passive)/radius(passive),-.25);}groups++;
// Conditional intersection and restorative scalar sign for the actual chosen curve family.
for(const pf of[-1,3,7,12])for(const c of[.5,1,2])for(const R of[.5,1.4,3]){const co=p=>Math.max(0,13*c*(1-Math.exp(-(p+4)/8.2))),vr=p=>Math.max(0,(pf-Math.max(p,-2))/R),f=p=>vr(p)-co(p);assert.ok(f(-4)>0&&f(pf)<0);let lo=-4,hi=pf;for(let j=0;j<60;j++){const m=(lo+hi)/2;if(f(m)>0)lo=m;else hi=m;}const p=(lo+hi)/2;near(f(p),0,1e-8);assert.ok(f(p-.001)>0&&f(p+.001)<0);}groups++;
console.log(`PASS ${groups} independent PHYSIO prerequisite mathematical groups`);
