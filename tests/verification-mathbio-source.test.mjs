import { teachingAgeGrid, advanceAgeDensity, ageMass } from '../content/mathbio/age-pde.shared.js';
import { functionalResponse, simulateResponse } from '../content/mathbio/functional-response.shared.js';
import { leslie, nnClass, normalizedProjection, turtleMatrix, domEig, dotv, survivorship, r0T, project } from '../content/mathbio/ch04.shared.js';
import { breakEven, chemostatField, chemostatPrediction } from '../content/mathbio/chemostat.shared.js';
import { hostParasitoid, juryStable, attackFree } from '../content/mathbio/ch02.shared.js';
import { nicheOverlap, symmetricCompetitionOutcome } from '../content/mathbio/niche-overlap.shared.js';
import test from 'node:test';import assert from 'node:assert/strict';
import{lvField,lvV,lvSectionOffset,rk4sys,cycleMean,lvOrbitPeriod}from'../content/mathbio/ch03.shared.js';
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('Lotka original variables rescale to the displayed constant-coefficient system',()=>{
 for(const[A1,A2,B1,B2,X1,X2]of[[1,.4,.2,.6,5,3],[2,3,4,.5,.7,.9],[.4,1,1,2,2,1]]){const P=A2*X1,H=B1*X2;const scaled=lvField(A1,B2)(0,[P,H]);near(scaled[0],A2*X1*(A1-B1*X2));near(scaled[1],B1*X2*(A2*X1-B2));const J12=-B1*B2/A2,J21=A1*A2/B1;near(J12*J21,-A1*B2);}
});
test('nonlinear invariant stays constant and small orbits approach the linear period',()=>{
 for(const[a,g]of[[.4,2],[1,1],[2,.4]]){const F=lvField(a,g),s=rk4sys(F,[g+.1,a],50,10000),V0=lvV(a,g,g+.1,a);for(const p of s.ys)near(lvV(a,g,...p),V0,2e-8);const T=lvOrbitPeriod(a,g,.001,80,.005);near(T,2*Math.PI/Math.sqrt(a*g),1e-5);}
});
test('law 1 gold point represents the actual dragged orbit, including points away from the reference section',()=>{
 for(const[a,g,x,y]of[[1,1,.3,2.5],[.5,1.5,2,.4],[1.5,.5,.1,3],[1,1,1,1]]){const s=lvSectionOffset(a,g,x,y);near(lvV(a,g,g+s,a),lvV(a,g,x,y));if(x===g&&y===a)assert.equal(s,0);else{const sol=rk4sys(lvField(a,g),[x,y],100,20000),xs=sol.ys.map(p=>p[0]),C=cycleMean(sol.ts,xs,xs,g);assert.ok(C);near(C.period,lvOrbitPeriod(a,g,s,100,.005),2e-4);}}
});
test('Volterra full-cycle means and harvest response follow independently integrated equations',()=>{
 for(const E of [0,.2,.45]){const a=1.2,g=.7,sol=rk4sys((t,[x,y])=>[x*(a-E-y),y*(x-g-E)],[1.8,.8],150,30000),xs=sol.ys.map(p=>p[0]),ys=sol.ys.map(p=>p[1]),mx=cycleMean(sol.ts,xs,xs,g+E),my=cycleMean(sol.ts,ys,xs,g+E);assert.ok(mx&&my);near(mx.mean,g+E,2e-6);near(my.mean,a-E,2e-6);}
});

test('niche coefficient equals the independently quadrature-integrated Gaussian product, with neutral equality explicit',()=>{
 for(const d of [0,.1,1,2,4]){let q=0;const dx=.001;for(let x=-10;x<14;x+=dx)q+=Math.exp(-x*x/2-(x-d)**2/2)/Math.sqrt(Math.PI)*dx;near(q,nicheOverlap(d),1e-10);}
 assert.equal(symmetricCompetitionOutcome(1,1),'neutral: identical species');
 assert.equal(symmetricCompetitionOutcome(.8,1),'stable coexistence');
 assert.equal(symmetricCompetitionOutcome(.8,.8),'marginal invasion boundary');
 for(const k of [.6,1,1.6]){const sol=rk4sys((t,[x,y])=>[x*(1-x-y),y*(1-(x+y)/k)],[.05,.05],500,25000,0),p=sol.ys.at(-1);if(k===1){near(p[0]+p[1],1);near(p[0],p[1]);}else if(k<1)assert.ok(p[1]<1e-12);else assert.ok(p[0]<1e-12);}
});

test('May map equilibrium and exact derivative agree with independent differences and all Jury conditions',()=>{
 for(const l of [1.05,1.2,3,12])for(const k of [.1,.5,1,2,20,Infinity]){
  const m=hostParasitoid(l,k),j=m.jac(),f=m.F(m.Ns,m.Ps);near(f[0]/m.Ns,1);near(f[1]/m.Ps,1);
  const x=m.Ns,y=m.Ps,hx=x*1e-5,hy=y*1e-5;const a=m.F(x+hx,y),b=m.F(x-hx,y),c=m.F(x,y+hy),d=m.F(x,y-hy);
  near((a[0]-b[0])/(2*hx),j.J[0][0],1e-8);near((c[0]-d[0])/(2*hy),j.J[0][1],1e-8);near((a[1]-b[1])/(2*hx),j.J[1][0],1e-8);near((c[1]-d[1])/(2*hy),j.J[1][1],1e-8);
  assert.equal(juryStable(j.T,j.D),k<1);assert.ok(1-j.T+j.D>0);assert.ok(1+j.T+j.D>0);if(k===1)assert.equal(j.D,1);
 }
 near(attackFree(1e5,.7),Math.exp(-.7),.000003);
});

test('chemostat obeys the exact mass identity and distinguishes ties, exclusion and washout',()=>{
 const strains=[[1,1.2],[.7,.3],[.9,.6],[.5,.1]];
 assert.deepEqual(chemostatPrediction(strains.map(([m,K])=>breakEven(.4,m,K)),3),[1,3]);
 assert.deepEqual(chemostatPrediction(strains.map(([m,K])=>breakEven(.8,m,K)),3),[]);
 for(const D of [.1,.3,.4,.6,.8]){const field=chemostatField(D,3,strains),initial=[3,.1,.2,.3,.4],s=rk4sys(field,initial,100,20000,0);for(let i=0;i<s.ts.length;i+=100){const sum=s.ys[i].reduce((a,b)=>a+b,0);near(sum,3+Math.exp(-D*s.ts[i]),1e-9);assert.ok(s.ys[i].every(x=>x>=0));}}
 const sol=rk4sys(chemostatField(.3,3,strains),[3,.1,.1,.1,.1],1500,30000,0),last=sol.ys.at(-1);near(last[0],.15,1e-8);near(last[4],2.85,1e-7);assert.ok(last.slice(1,4).every(x=>x<1e-7));
});

test('Leslie zero-fecundity endpoints distinguish periodic, reducible and extinct normalized populations',()=>{
 const s=[.8,.8,.8];assert.deepEqual(nnClass(leslie([0,0,1,1],s)),{irreducible:true,period:1});assert.deepEqual(nnClass(leslie([0,0,0,1],s)),{irreducible:true,period:4});assert.equal(nnClass(leslie([0,0,1,0],s)).irreducible,false);
 for(const start of [[1,0,0,0],[0,0,0,1],[.1,.2,.3,.4]]){const r=normalizedProjection(leslie([0,0,0,0],s),start,8);assert.equal(r[4],null);assert.equal(r[8],null);for(const p of r.filter(Boolean))near(p.reduce((a,b)=>a+b,0),1);}
 const A=leslie([0,0,1,1],s),a=normalizedProjection(A,[1,0,0,0],200).at(-1),b=normalizedProjection(A,[0,0,0,1],200).at(-1);a.forEach((x,i)=>near(x,b[i],1e-8));
});

test('original loggerhead Table 4 and its eigenvectors validate elasticities and coupled survival comparisons',()=>{
 const expected=[[0,0,0,0,127,4,80],[.6747,.737,0,0,0,0,0],[0,.0486,.661,0,0,0,0],[0,0,.0147,.6907,0,0,0],[0,0,0,.0518,0,0,0],[0,0,0,0,.8091,0,0],[0,0,0,0,0,.8091,.8089]],A=turtleMatrix();assert.deepEqual(A,expected);const e=domEig(A,6000),vwu=dotv(e.w,e.u),E=A.map((r,i)=>r.map((a,j)=>a/e.lam*e.w[i]*e.u[j]/vwu));near(e.lam,.9450,.00005);near(E.flat().reduce((a,b)=>a+b,0),1);near(e.u[0],.2065,.00005);near(e.w[3],115.845,.001);
 for(const [i,j]of[[0,4],[1,1],[3,2],[6,6],[0,1]]){const h=1e-5,P=A.map(r=>r.slice()),M=A.map(r=>r.slice());P[i][j]+=h;M[i][j]-=h;near((domEig(P,6000).lam-domEig(M,6000).lam)/(2*h),e.w[i]*e.u[j]/vwu,.000001);}
 for(const factor of [1.01,1.1,1.3])near(domEig(turtleMatrix([factor,1,1,1,1,1,1]),6000).lam,domEig(turtleMatrix(undefined,factor),6000).lam,1e-10);
 const egg=E[1][0];assert.ok(E[5][4]<egg&&E[6][5]<egg);
});

test('disc response uses completed events and obeys time budgets, saturation and risk extrema',()=>{
 for(const a of [.2,.8,2])for(const h of [.1,.5,1]){const N=1/(a*h);near(functionalResponse('II',N,a,h),1/(2*h));const M=1/Math.sqrt(a*h),risk=x=>functionalResponse('III',x,a,h)/x;assert.ok(risk(M)>risk(.9*M)&&risk(M)>risk(1.1*M));for(const t of ['I','II','III'])assert.equal(functionalResponse(t,0,a,h),0);}
 for(const type of ['II','III'])for(const N of [.5,2,10]){const a=.8,h=.5,T=10000,rate=a*(type==='III'?N*N:N),random=()=>-Math.expm1(-1);const measured=simulateResponse(type,N,a,h,T,random);near(measured,functionalResponse(type,N,a,h),1/T+.000000001);assert.ok(measured<=1/h);}
 assert.equal(simulateResponse('II',1,1,1,.5,()=>0),0);
});

test('age characteristic scheme and Euler–Lotka root share the same newborn boundary and stable eigenmode',()=>{
 for(const level of [.3,1,2]){const g=teachingAgeGrid('young',level),h=.1;near(ageMass(g.snaps[0],h),1);const next=advanceAgeDensity(g.stable,g.survival,g.fertility,h),factor=Math.exp(g.r*h);next.forEach((x,i)=>near(x,g.stable[i]*factor,1e-12));
  for(const s of g.snaps)assert.ok(s.every(x=>x>=0&&Number.isFinite(x)));
  const u=g.snaps.at(-1),births=h*u.reduce((s,x,i)=>s+(i===0||i===u.length-1?.5:1)*g.fertility[i]*x,0);near(u[0],births,1e-9);
 }
 const initial=[1,2,3,4],survival=[.9,.8,.7];assert.deepEqual(advanceAgeDensity(initial,survival,[0,0,0,0],.1),[0,.9,1.6,2.0999999999999996]);
});

test('momentum projection equals independently iterated stationary population and includes the no-change endpoint',()=>{
 const survival=[.985,.985,.98,.97,.96,.94,.9,.84,.7],base=[0,0,.7,1.3,1.3,.9,.4,0,0,0],l=survivorship(survival),R=r0T(l,base).R0;
 for(const initialR of [1,2,3]){const F=base.map(x=>x/R),stationary=leslie(F,survival),e=domEig(stationary),initial=domEig(leslie(F.map(x=>x*initialR),survival)).u;near(e.lam,1,1e-12);const predicted=dotv(e.w,initial)/dotv(e.w,e.u),actual=project(stationary,initial,1000).at(-1).reduce((a,b)=>a+b,0);near(actual,predicted,1e-9);if(initialR===1)near(predicted,1,1e-12);else assert.ok(predicted>1);}
});
