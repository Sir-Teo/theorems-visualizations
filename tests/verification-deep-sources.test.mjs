import test from 'node:test';import fs from 'node:fs';import assert from 'node:assert/strict';
import {adaptiveStep,quadraticRun,linearLoss,linearRun,eulerPath,rk4Path,residualModel,residualReference,scaleData,centerBatch,scaleLoss,scaleRun,logRange,positiveRange} from '../content/deep/source-audit.shared.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t*(1+Math.abs(a)+Math.abs(b)),`${a} ≈ ${b}`),norm=x=>Math.hypot(...x),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),diff=(f,w,h=1e-6)=>w.map((_,i)=>{const p=w.slice(),m=w.slice();p[i]+=h;m[i]-=h;return(f(p)-f(m))/(2*h);});
test('AdaGrad and RMSProp agree with closed-form constant-gradient histories; no step-size bound is inferred',()=>{
 for(const kind of ['ada','rms']){let st;for(let t=1;t<=30;t++){st=adaptiveStep([2,-7],st,{kind,eta:.2,epsilon:0});for(let i=0;i<2;i++){const g=[2,-7][i],s=kind==='ada'?t*g*g:(1-.9**t)*g*g;near(st.s[i],s);near(st.delta[i],Math.sign(g)*.2/(kind==='ada'?Math.sqrt(t):Math.sqrt(1-.9**t)));}}}
 let st=adaptiveStep([10],null,{kind:'ada',epsilon:0});st=adaptiveStep([.001],st,{kind:'ada',epsilon:0});const small=st.delta[0],rate=st.rate[0];st=adaptiveStep([100],st,{kind:'ada',epsilon:0});assert.ok(st.delta[0]>small*100);assert.ok(st.rate[0]<rate);
});
test('Adam moments equal independent geometric sums, including nonstationary history and zero current gradient',()=>{
 const hist=[[2,-1],[-4,3],[0,0],[1,9]];let st;for(let t=1;t<=hist.length;t++){st=adaptiveStep(hist[t-1],st,{eta:.3});for(let j=0;j<2;j++){const m=hist.slice(0,t).reduce((s,g,k)=>s+.1*.9**(t-1-k)*g[j],0),s=hist.slice(0,t).reduce((z,g,k)=>z+.001*.999**(t-1-k)*g[j]**2,0);near(st.m[j],m);near(st.s[j],s);near(st.delta[j],.3*m/(1-.9**t)/(Math.sqrt(s/(1-.999**t))+1e-8));}if(t===3){assert.notEqual(st.delta[0],0);assert.ok(st.rate.every(Number.isFinite));}}
 const corrected=adaptiveStep([8,-3],null,{eta:.1,epsilon:0}),raw=adaptiveStep([8,-3],null,{eta:.1,correction:false,epsilon:0});near(norm(corrected.delta),Math.SQRT2*.1);near(norm(raw.delta),Math.SQRT2*.1*.1/Math.sqrt(.001));
});
test('adaptive quadratic plots use finite denominator multipliers, and GD matches exact powers',()=>{
 for(const a of [1,50,400])for(const eta of [.01,.1,.5])for(const kind of ['gd','ada','rms','adam'])for(const correction of [true,false]){const R=quadraticRun(a,eta,kind,correction);assert.equal(R.f.length,101);assert.ok([...R.f,...R.re.flat(),...R.pts.flat()].every(Number.isFinite));assert.ok(R.re.flat().every(x=>x>0));if(kind==='gd')for(const k of [1,10,100]){near(R.pts[k][0],.1**k);near(R.pts[k][1],(1-.9/a)**k);}}
});
test('deep-linear analytic gradients and Hessians match independent finite differences even at zero weights',()=>{
 for(const w of [[.4,-.8],[1.2,.2,-.3],[0,0,2],[0,.7,0],[0,0,0]]){const {g,H}=linearLoss(w,1.3),numeric=diff(x=>linearLoss(x,1.3).L,w);g.forEach((x,i)=>near(x,numeric[i],2e-8));for(let j=0;j<w.length;j++){const p=w.slice(),m=w.slice(),h=1e-5;p[j]+=h;m[j]-=h;const gp=linearLoss(p,1.3).g,gm=linearLoss(m,1.3).g;for(let i=0;i<w.length;i++)near(H[i][j],(gp[i]-gm[i])/(2*h),2e-8);}}
});
test('linear saddle constructions distinguish all-zero weights from zero projected coordinates',()=>{
 const c=1.4,H=linearLoss([0,0],c).H;near(H[0][1],-c);near(H[0][0],0); // eigenvalues ±c
 assert.ok(linearLoss([0,0,0],c).H.flat().every(x=>x===0));const z=linearLoss([0,0,2],c).H;near(z[0][1],-2*c); // source Appendix C.1 cannot leave last matrix arbitrary at D=3
 for(const t of [.01,.001]){assert.ok(linearLoss([t,t,t],c).L<c*c/2);assert.ok(linearLoss([-t,-t,-t],c).L>c*c/2);}
 const R=linearRun([0,0,0],c);assert.equal(R.status,'unfinished');assert.ok(R.loss.every(x=>x===c*c/2));assert.deepEqual(R.w,[0,0,0]);
});
test('finite linear runs classify final outcomes and stopping honestly; no false all-runs convergence',()=>{
 const small=linearRun([.01,.01,.01],.3);assert.equal(small.status,'unfinished');assert.equal(small.hit,null);
 const stopped=linearRun([5,5,5],2);assert.equal(stopped.status,'stopped');assert.ok(stopped.loss.every(Number.isFinite));assert.ok(stopped.fin>1e12);assert.deepEqual(stopped.tr.at(-1),stopped.w.slice(0,2));
 const fit=linearRun([.6,.7],1);assert.equal(fit.status,'below');assert.ok(fit.hit<1200);assert.ok(fit.fin<1e-3);
});
test('Euler and RK4 match independent exact linear ODE formulas and first/fourth-order limits',()=>{
 const f=(x,y)=>[x,-2*y],p=[1,2];for(const n of [4,8,16,32]){const e=eulerPath(f,p,n).at(-1);near(e[0],(1+1/n)**n);near(e[1],2*(1-2/n)**n);const R=z=>1+z+z*z/2+z**3/6+z**4/24,r=rk4Path(f,p,1,n,n).at(-1);near(r[0],R(1/n)**n);near(r[1],2*R(-2/n)**n);}
 const exact=[Math.E,2*Math.exp(-2)],err=(method,n)=>norm(method(f,p,1,n,n).at(-1).map((x,i)=>x-exact[i]));const e32=eulerPath(f,p,32).at(-1),e64=eulerPath(f,p,64).at(-1);assert.ok(norm(e32.map((x,i)=>x-exact[i]))/norm(e64.map((x,i)=>x-exact[i]))>1.95);assert.ok(err(rk4Path,16)/err(rk4Path,32)>15);
});
test('continuity alone does not ensure Euler first order; finite Euler blocks can collapse distinct inputs',()=>{
 const collapse=(x,y)=>[-x,-y];assert.deepEqual(eulerPath(collapse,[1,2],1).at(-1),[0,0]);assert.deepEqual(eulerPath(collapse,[-3,8],1).at(-1),[0,0]);near(rk4Path(collapse,[1,2],1,128,128).at(-1)[0],Math.exp(-1),1e-10);
 // Absolutely convergent cosine series Σ cos(2π·2^j t)/j² is continuous and has integral 0.
 // For L=2^m its left Riemann sum is Σ_{j≥m}1/j² ≥1/(4m): no O(1/L) rate.
 // Verify the frequency-alias calculation on finite partial sums, whose integrals are exactly zero.
 for(const m of [4,6,8]){const field=(x,y,t)=>[Array.from({length:16},(_,i)=>Math.cos(2*Math.PI*2**(i+1)*t)/(i+1)**2).reduce((a,b)=>a+b),0],value=eulerPath(field,[0,0],2**m).at(-1)[0],tail=Array.from({length:17-m},(_,i)=>1/(m+i)**2).reduce((a,b)=>a+b);near(value,tail,1e-10);assert.ok(value>=1/(4*m));}
});
test('actual tanh field has valid global derivative bounds and a well-resolved numerical reference',()=>{
 const m=residualModel();for(const a of [.5,1.1,3]){const b=m.bounds(a);for(const x of [-10,-1,2,15])for(const t of [0,.5,1]){const p=[x,-x/3],q=[x+.3,-x/3-.7];assert.ok(norm(m.field(...p,t,a))<=b.F+1e-10);assert.ok(norm(m.field(...p,t,a).map((v,j)=>v-m.field(...q,t,a)[j]))<=b.K*norm(p.map((v,j)=>v-q[j]))+1e-10);const h=1e-5,ft=m.field(...p,t+h,a).map((v,j)=>(v-m.field(...p,t-h,a)[j])/(2*h));assert.ok(norm(ft)<=b.T+1e-8);}
 const R=residualReference(m,a);assert.ok(R.discrepancy<4e-9);assert.ok(R.discrepancy<R.err.at(-1)*1e-5);const order=Math.log2(R.err[11]/R.err[13]);assert.ok(order>.98&&order<1.02);const p=m.P0[0],refined=rk4Path(m.field,p,a,1600,1600).at(-1);assert.ok(norm(refined.map((x,i)=>x-R.ex[0][i]))<1e-9);}
});
test('ideal BN logistic gradient differentiates through variance, matches finite differences and inverse scaling',()=>{
 const data=scaleData();assert.ok(data.S[0][0]*data.S[1][1]-data.S[0][1]**2>0);for(const w of [[-.5,-.45],[2,-1],[.001,.003]])for(const gamma of [.3,3,7]){const r=scaleLoss(w,data,{gamma}),g=diff(x=>scaleLoss(x,data,{gamma}).L,w,1e-7);r.g.forEach((v,i)=>near(v,g[i],w[0]===.001?2e-6:1e-7));near(dot(w,r.g),0);for(const c of [.1,2,9]){const z=scaleLoss(w.map(x=>c*x),data,{gamma});near(z.L,r.L);z.g.forEach((v,i)=>near(c*v,r.g[i]));}}
 assert.ok(Number.isNaN(scaleLoss([0,0],data).L));
});
test('each scale-invariant minibatch remains orthogonal even with a changing learned gain',()=>{
 const d=scaleData(),w=[.8,-.3];for(const ids of [[0,1,2,3],[7,12,19,22,30],Array.from({length:40},(_,i)=>i)]){const batch=centerBatch(ids.map(i=>d.X[i]),ids.map(i=>d.Y[i]));for(const gamma of [0,.2,3,10])near(dot(w,scaleLoss(w,batch,{gamma}).g),0);}
});
test('a positive epsilon and a plain unit actually break exact scale identities',()=>{
 const d=scaleData(),w=[.02,-.01];for(const options of [{epsilon:.1},{bn:false}]){const r=scaleLoss(w,d,options),s=scaleLoss(w.map(x=>3*x),d,options);assert.ok(Math.abs(r.L-s.L)>1e-4);assert.ok(Math.abs(dot(w,r.g))>1e-4);}
});
test('scale-invariant norm recurrence, angular update and decay balance denominator are exact',()=>{
 const d=scaleData(),w=[-.5,-.45],r=norm(w),{g}=scaleLoss(w,d),eta=.3,next=w.map((x,i)=>x-eta*g[i]),u=w.map(x=>x/r),gu=g.map(x=>r*x),direction=u.map((x,i)=>x-eta/(r*r)*gu[i]),dn=norm(direction);
 next.forEach((x,i)=>near(x/norm(next),direction[i]/dn));near(Math.acos(dot(w,next)/(r*norm(next))),Math.atan(eta*norm(g)/r));
 for(const eta of [.02,3])for(const lambda of [0,.03])for(const rho of [.2,3]){const R=scaleRun(w.map(x=>x*rho/r),d,{eta,lambda});for(let i=0;i<=400;i++)near(R.nrm[i],R.prediction[i],1e-11);assert.ok(R.residual<1e-12);if(lambda===0)for(let i=1;i<=400;i++)assert.ok(R.nrm[i]>=R.nrm[i-1]-1e-12);}
 const e=.3,l=.02,G=.8,R=Math.sqrt(e*G*G/(2*l-e*l*l));near((1-e*l)**2*R+e*e*G*G/R,R);
});
test('decay need not settle to a positive equilibrium; chart ranges include finite data without clipping',()=>{
 // At a stationary angular direction g=0, decay keeps shrinking rather than balancing a nonzero noise term.
 let w=[1,0];for(let i=0;i<100;i++)w=w.map(x=>.99*x);assert.ok(norm(w)<.37);
 const d=scaleData();for(const bn of [true,false]){const R=scaleRun([-.14,-Math.sqrt(.04-.14**2)],d,{eta:3,lambda:.03,bn});for(const values of [R.loss,R.eff]){const[lo,hi]=positiveRange(values);assert.ok(values.every(x=>x>=lo&&x<=hi));}}
 const yr=logRange([1e-30,1e22]);assert.ok(yr[0]<-16&&yr[1]>22);
});

test('all 144 actual tanh-field RK4 endpoints agree with independent high-accuracy SciPy DOP853 references',()=>{
 const r=JSON.parse(fs.readFileSync(new URL('./verification-deep-reference.json',import.meta.url)));assert.match(r.method,/DOP853/);const m=residualModel();for(const [a,pts]of Object.entries(r.amplitudes)){const R=residualReference(m,+a);assert.equal(pts.length,48);for(let i=0;i<48;i++)assert.ok(norm(pts[i].map((x,j)=>x-R.ex[i][j]))<3e-10);}
});
test('a valid rank-one bottleneck optimum is not an unrestricted-product stationary point',()=>{
 // X=I₂, Y=diag(3,2), hidden width1: XXᵀ=I, XYᵀ full rank, Σ=diag(9,4) distinct.
 // W2=(√3,0)ᵀ, W1=(√3,0) gives B=diag(3,0); best rank1 residual² is 2².
 const q=Math.sqrt(3),W1=[q,0],W2=[q,0],Y=[[3,0],[0,2]],B=W2.map(x=>W1.map(y=>x*y)),E=B.map((row,i)=>row.map((x,j)=>x-Y[i][j]));near(E.flat().reduce((s,x)=>s+x*x,0)/2,2);
 const dW1=[0,1].map(j=>W2.reduce((s,x,i)=>s+x*E[i][j],0)),dW2=E.map(row=>dot(row,W1));assert.ok([...dW1,...dW2].every(x=>Math.abs(x)<1e-14));assert.equal(E[1][1],-2); // unrestricted B-gradient is not zero
});
