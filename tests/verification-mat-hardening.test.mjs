import test from 'node:test';import assert from'node:assert/strict';
import{edgeGlideForce,ensembleForces,annihilatePairs,hardeningProtocol,stressUnits,densityFit}from'../content/mat/source-audit-hardening.shared.js';
const near=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('edge-glide kernel obeys independent isotropic stress components, antisymmetry, pair balance and inverse-length scaling away from core',()=>{
 for(const[x,y]of[[.1,0],[.2,.3],[-.2,.3],[.1,.1]]){const theta=Math.atan2(y,x),r=Math.hypot(x,y),stress=Math.cos(theta)*Math.cos(2*theta)/r;near(edgeGlideForce(x,y),stress,2e-8);near(edgeGlideForce(-x,y),-edgeGlideForce(x,y));near(edgeGlideForce(2*x,2*y)*2,edgeGlideForce(x,y),2e-8);}
 const q={x:[.1,.4,.7],y:[.2,.5,.8],s:[-1,1,-1]},f=ensembleForces(q,.6);near(f.reduce((s,x)=>s+x,0),-.6);const g=ensembleForces({...q,x:q.x.map(x=>(x+.6)%1)},.6);for(let i=0;i<f.length;i++)near(f[i],g[i]);
});
test('annihilation is same-plane and opposite-sign, including torus boundary and a second newly exposed pair',()=>{const q={x:[.999,.001,.4,.405],y:[.2,.2,.4,.4],s:[1,-1,1,-1]};assert.equal(annihilatePairs(q),2);assert.equal(q.x.length,0);const p={x:[.4,.405],y:[.2,.21],s:[1,-1]};assert.equal(annihilatePairs(p),0);});
test('cumulative signed glide survives annihilation, differs from absolute mean, and empty/censored populations remain explicit',()=>{
 const initial={x:[.491,.509],y:[.2,.2],s:[-1,1]},r=hardeningProtocol(2,1,{initial,relaxSteps:0,rampSteps:1,tmax:0});near(r.slip,-2*4e-5/.018,1e-9);assert.equal(r.final.x.length,0);assert.equal(r.n0,2);assert.equal(r.flow,null);assert.ok(r.curve[0][1]<0);assert.equal(r.status,'censored');assert.deepEqual(initial.x,[.491,.509]);
 const empty=hardeningProtocol(2,1,{initial:{x:[.49,.5],y:[.2,.2],s:[-1,1]},relaxSteps:1,rampSteps:8,tmax:0});assert.equal(empty.status,'empty');assert.equal(empty.n0,0);assert.equal(empty.ell,null);
 const censored=hardeningProtocol(10,10);assert.equal(censored.status,'censored');assert.equal(censored.flow,null);near(censored.tmax,1+2.2*Math.sqrt(censored.n0));
});
test('independent all-ordered-pair integrator matches finite protocol with explicit time dependence and nonzero preparation residual',()=>{
 const initial={x:[.1,.42,.72],y:[.2,.52,.85],s:[-1,1,-1]},r=hardeningProtocol(3,1,{initial,relaxSteps:0,rampSteps:30,tmax:4}),x=[...initial.x],y=initial.y,s=initial.s;let slip=0;
 for(let k=1;k<=30;k++){const next=x.map((xi,i)=>{let F=s[i]*4*k/30;for(let j=0;j<x.length;j++){if(i===j)continue;let dx=xi-x[j],dy=y[i]-y[j];dx-=Math.floor(dx+.5);dy-=Math.floor(dy+.5);const radial=dx*dx+dy*dy+1e-12;F+=s[i]*s[j]*dx*(dx*dx-dy*dy)/(radial*radial);}const d=Math.min(.003,Math.max(-.003,4e-5*F));slip+=s[i]*d;return((xi+d)%1+1)%1;});x.splice(0,3,...next);}
 near(r.slip,slip);for(let i=0;i<3;i++)near(r.final.x[i],x[i]);const a=hardeningProtocol(50,7),b=hardeningProtocol(50,7,{refinement:2});assert.ok(a.residual>1&&b.residual>1);assert.notEqual(a.flow,b.flow);assert.deepEqual(a,hardeningProtocol(50,7));near(stressUnits(2*Math.PI*.7),1);
});
test('density regression identifies only supported variation and excludes right-censored response limits',()=>{assert.equal(densityFit([{n:10,y:1,censored:true}]),null);const q=densityFit([{n:4,y:1},{n:9,y:1.5},{n:16,y:2},{n:100,y:100,censored:true}]);near(q.alpha,.5);near(q.exponent,.5);assert.equal(q.censored,1);assert.equal(q.count,3);assert.equal(densityFit([{n:4,y:1},{n:4,y:2}]).exponent,null);});
