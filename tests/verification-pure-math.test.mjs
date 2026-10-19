import{test}from'node:test';import assert from'node:assert/strict';import{hillPair,invMod,m26,gcdN}from'../content/alg/ch07.shared.js';
test('the source affine Hill example gives HELP→RRGR and recovers all676 letter pairs',()=>{
 const A=[3,5,1,2],b=[2,2];assert.deepEqual(hillPair(A,b,[7,4]),[17,17]);assert.deepEqual(hillPair(A,b,[11,15]),[6,17]);
 for(const a of[A,[3,3,2,5],[2,0,0,1]])for(const off of[b,[0,0],[25,7]]){const[a0,a1,a2,a3]=a,d=m26(a0*a3-a1*a2),image=new Set;for(let x=0;x<26;x++)for(let y=0;y<26;y++){const c=hillPair(a,off,[x,y]);image.add(c.join(','));if(gcdN(d,26)===1){const di=invMod(d,26),back=hillPair([di*a3,-di*a1,-di*a2,di*a0],[0,0],c.map((v,i)=>m26(v-off[i])));assert.deepEqual(back,[x,y]);}}assert.equal(image.size===676,gcdN(d,26)===1);}
});
import {lp2} from '../content/opt/ch04.shared.js';
test('LP status comes from the recession cone rather than the drawing box',()=>{
 const h=(nx,ny,c)=>({nx,ny,c});
 let r=lp2([1,0],[h(-1,0,-20)],2);assert.equal(r.status,'optimal');assert.ok(Math.hypot(r.x[0]-20,r.x[1])<1e-12);assert.equal(r.f,20);
 r=lp2([1,0],[h(-1,0,0)],2);assert.equal(r.status,'optimal');assert.equal(r.f,0); // optimal face is unbounded, value is finite
 r=lp2([-1,0],[h(-1,0,0)],2);assert.equal(r.status,'unbounded');
 r=lp2([0,0],[],2);assert.equal(r.status,'optimal');
 r=lp2([1,2],[h(1,0,3),h(-1,0,-3),h(0,1,4),h(0,-1,-4)],1);assert.equal(r.status,'optimal');assert.deepEqual(r.x,[3,4]);assert.equal(r.f,11);
 assert.equal(lp2([1,0],[h(1,0,0),h(-1,0,-1)],2).status,'infeasible');
 assert.equal(lp2([1,0],[h(0,0,-1)],2).status,'infeasible');
});
import {tableOf,irrepMats,cadd,cmul,cconj,csc,cabs} from '../content/rep/ch03.shared.js';
import {fsIndicator,moleculeData,atomPerm,displacementChars,projectDisp,pgDecompose} from '../content/rep/ch04.shared.js';
test('unitary matrix coefficients and square-root counts give independent representation checks',()=>{
 for(const key of ['S3','D4','D5','Q8','A4']){
  const{G,rows}=tableOf(key), reps=irrepMats(key);
  for(const a of reps)for(const b of reps)for(let i=0;i<a.d;i++)for(let j=0;j<a.d;j++)for(let k=0;k<b.d;k++)for(let l=0;l<b.d;l++){
   let z=[0,0];for(let g=0;g<G.n;g++)z=cadd(z,cmul(a.mats[g][i][j],cconj(b.mats[g][k][l])));z=csc(z,1/G.n);
   const expected=a===b&&i===k&&j===l?1/a.d:0;assert.ok(Math.hypot(z[0]-expected,z[1])<1e-9,`${key} matrix coefficient`);
  }
  const nu=rows.map(r=>fsIndicator(G,r.vals));for(let g=0;g<G.n;g++){
   const roots=G.mul.filter((r,h)=>r[h]===g).length;
   const prediction=rows.reduce((z,r,i)=>cadd(z,csc(r.vals[G.cls[g]],nu[i])),[0,0]);assert.ok(Math.hypot(prediction[0]-roots,prediction[1])<1e-9);
  }
 }
});
test('nonlinear molecular displacement characters and isotypic projectors recover geometric dimensions',()=>{
 for(const key of ['H2O','NH3']){
  const mol=moleculeData(key),P=mol.P,n=mol.atoms.length,chars=displacementChars(mol),expected=key==='H2O'?[2,0,1,0]:[2,0,2];
  const vib=chars.disp.map((x,k)=>x-chars.trans[k]-chars.rot[k]);const mult=pgDecompose(P,vib);mult.forEach((x,i)=>assert.ok(Math.abs(x-expected[i])<1e-10));assert.ok(Math.abs(mult.reduce((s,x,i)=>s+x*P.irreps[i].d,0)-(3*n-6))<1e-10);
  const seed=mol.atoms.map((_,i)=>[i+1,2-i,.3*i]);const parts=P.irreps.map(ir=>projectDisp(mol,ir,seed));
  for(let a=0;a<n;a++)for(let d=0;d<3;d++)assert.ok(Math.abs(parts.reduce((s,p)=>s+p[a][d],0)-seed[a][d])<1e-10);
  for(let i=0;i<parts.length;i++)for(let j=0;j<parts.length;j++){
   const pp=projectDisp(mol,P.irreps[j],parts[i]);for(let a=0;a<n;a++)for(let d=0;d<3;d++)assert.ok(Math.abs(pp[a][d]-(i===j?parts[i][a][d]:0))<1e-10);
  }
 }
});
import * as numericMath from '../assets/js/viz/math.js';
import {formSpace} from '../content/rep/ch04.shared.js';
test('bilinear-form search matches each cyclic and quaternionic character by its distinct label',()=>{
 for(const key of ['Z3','Z4','S3','D4','Q8','A4']){const{G,rows}=tableOf(key),seen=new Set;for(const ir of irrepMats(key)){const i=rows.findIndex(r=>r.tex===ir.tex);assert.ok(i>=0&&!seen.has(i));seen.add(i);const s=formSpace(numericMath,ir.mats,'sym').length,a=formSpace(numericMath,ir.mats,'alt').length;assert.ok(Math.abs((s?1:a?-1:0)-fsIndicator(G,rows[i].vals))<1e-9,`${key}:${ir.tex}`);}}
});
import {legendre,jacobi,gaussSum,jw,fac} from '../content/nt/ch04.shared.js';
test('quadratic characters and composite Gauss sums agree with direct residue counting',()=>{
 const primes=[];for(let p=3;p<=101;p+=2)if(Array.from({length:p-2},(_,i)=>i+2).every(d=>p%d))primes.push(p);
 for(const p of primes){const squares=new Set(Array.from({length:p-1},(_,x)=>(x+1)**2%p));for(let a=1;a<p;a++){const expected=squares.has(a)?1:-1;assert.equal(legendre(a,p),expected);let parity=0;for(let k=1;k<=(p-1)/2;k++)parity+=(a*k%p)>p/2;assert.equal((-1)**parity,expected);}
  for(const q of primes)if(q!==p)assert.equal(legendre(p,q)*legendre(q,p),(-1)**(((p-1)/2)*((q-1)/2)));
 }
 for(let n=3;n<=101;n+=2){const g=gaussSum(n,jw(n)),square=[g[0]**2-g[1]**2,2*g[0]*g[1]],sqf=fac(n).every(([,e])=>e===1);assert.ok(Math.hypot(square[0]-(sqf?jacobi(-1,n)*n:0),square[1])<1e-8,`n=${n}`);}
 assert.equal(jacobi(2,15),1);assert.equal(Array.from({length:15},(_,x)=>x*x%15).includes(2),false);
});
import {herbrandTerms,herbrandStage,skolemize,parseFO,neg} from '../content/logic/ch04.shared.js';
test('Herbrand term resource limits are explicit and never reported as a complete level',()=>{
 const binary=[{name:'f',arity:2}];assert.equal(herbrandTerms(['a'],binary,2).length,5);const complete=herbrandTerms(['a'],binary,3);assert.equal(complete.length,26);assert.equal(complete.capped,undefined);const truncated=herbrandTerms(['a'],binary,3,10);assert.equal(truncated.length,10);assert.equal(truncated.capped,true);
 const unary=[{name:'f',arity:1},{name:'g',arity:1}];assert.equal(herbrandTerms(['a'],unary,2).length,7);
});

import {fibBig,pruferDecode,pruferEncode,edgeKey} from '../content/comb/ch04.shared.js';
test('Fibonacci uniqueness intervals and every small Prüfer tree agree with independent enumeration',()=>{
 const F=fibBig(22).map(Number), ways=new Map;
 for(let m=0;m<(1<<18);m++)if(!(m&(m>>1))){let sum=0,k=0;for(let b=0;b<18;b++)if(m>>b&1){sum+=F[b+2];k=b+2;}assert.ok(!k||sum<F[k+1]);assert.equal(ways.has(sum),false);ways.set(sum,m);}
 for(let n=0;n<F[20];n++)assert.ok(ways.has(n),`missing ${n}`);
 for(let n=2;n<=6;n++){const trees=new Set,counts=Array(n).fill(0);for(let a=0;a<n**(n-2);a++){let r=a;const word=Array.from({length:n-2},()=>{const d=r%n;r=Math.floor(r/n);return d;});const {edges}=pruferDecode(n,word);const code=pruferEncode(n,edges).code;assert.deepEqual(code,word);assert.equal(edges.length,n-1);trees.add(edges.map(edgeKey).sort().join(','));const degree=edges.filter(e=>e.includes(0)).length;assert.equal(degree,1+word.filter(x=>x===0).length);counts[degree]++;}assert.equal(trees.size,n**(n-2));const choose=(a,b)=>{let z=1;for(let k=1;k<=b;k++)z=z*(a-k+1)/k;return z;};for(let d=1;d<n;d++)assert.equal(counts[d],choose(n-2,d-1)*(n-1)**(n-1-d));}
});
import {paramMesh,SURF,rayHits} from '../content/dg/ch04.shared.js';
test('mesh ray parity agrees with independent sphere membership away from tangencies',()=>{
 const mesh=paramMesh(SURF.sphere.F,[-Math.PI,Math.PI],[-Math.PI/2,Math.PI/2],64,36);
 for(const q of [[.1,.17,.23],[0,0,0],[1.5,.12,.21],[-1.5,.12,.21],[.2,1.3,.2]])for(const d of [[1,.03,.02],[.31,.52,.8]])assert.equal(rayHits(mesh,q,d).length%2,Math.hypot(...q)<1?1:0);
});

import {bracket2,PAIRS,flow2} from '../content/mfd/ch04.shared.js';
test('Lie brackets and numerical flows agree with independent closed forms',()=>{
 for(const p of [[.2,.5],[-1.3,.8],[.7,-.9]])for(const pair of Object.values(PAIRS)){const a=bracket2(pair.X,pair.Y,...p),b=pair.br(...p);assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);}
 for(const t of [-1,0,.3,1.2]){const p=[.7,-1.1],q=flow2((x,y)=>[-y,x],p,t,80),exact=[p[0]*Math.cos(t)-p[1]*Math.sin(t),p[0]*Math.sin(t)+p[1]*Math.cos(t)];assert.ok(Math.hypot(q[0]-exact[0],q[1]-exact[1])<1e-8);assert.ok(Math.abs(Math.hypot(...p)-Math.hypot(...q))<1e-8);}
});
import {luFactor,luSolveFl,ldlt,ldltD,inertiaOf,symbolicChol,arrowPattern} from '../content/nla/ch04.shared.js';
test('LU and block LDL reconstruct nonsingular and singular examples, while arrow fill depends on order',()=>{
 const mul=(A,B)=>A.map(r=>B[0].map((_,j)=>r.reduce((s,a,k)=>s+a*B[k][j],0))),transpose=A=>A[0].map((_,j)=>A.map(r=>r[j]));
 for(const A of [[[0,1],[1,0]],[[0,2,3],[2,0,-1],[3,-1,0]],[[1,2,0],[2,4,0],[0,0,0]],[[2,1,0],[1,-3,2],[0,2,1]]]){const f=ldlt(A),R=mul(mul(f.L,ldltD(f)),transpose(f.L));for(let i=0;i<A.length;i++)for(let j=0;j<A.length;j++)assert.ok(Math.abs(R[i][j]-A[f.perm[i]][f.perm[j]])<1e-10);const exact=numericMath.eigSym(A).values,c=inertiaOf(f);assert.deepEqual(c,{pos:exact.filter(v=>v>1e-9).length,neg:exact.filter(v=>v< -1e-9).length,zero:exact.filter(v=>Math.abs(v)<=1e-9).length});}
 const A=[[1,0],[100,101]],f=luFactor(A,{pivot:false});assert.equal(f.L[1][0],100);assert.deepEqual(luSolveFl(f,[1,201],53),[1,1]); // strict row dominance need not bound multipliers by1
 for(let n=2;n<=25;n++){const pat=arrowPattern(n),o=Array.from({length:n},(_,i)=>i);assert.equal(symbolicChol(pat,o).nnzL,n*(n+1)/2);assert.equal(symbolicChol(pat,o.toReversed()).nnzL,2*n-1);}
});

import {equiPts,baryW,lebFn,chebW,chebPts} from '../content/num/ch03.shared.js';
import {pade,cfApprox,clenshaw,newmanAbs,rationalExpBest} from '../content/num/ch04.shared.js';
test('Lebesgue evaluation avoids catastrophic denominator cancellation at degree60 and respects weight scaling',()=>{
 for(const xs of[equiPts(60),chebPts(60)])for(const x of[-.995,-.985,.987]){let ref=0;for(let j=0;j<xs.length;j++){let p=1;for(let k=0;k<xs.length;k++)if(k!==j)p*=(x-xs[k])/(xs[j]-xs[k]);ref+=Math.abs(p);}for(const scale of[1e-20,1,1e20])assert.ok(Math.abs(lebFn(xs,baryW(xs).map(w=>w*scale),x)/ref-1)<1e-12);}
 assert.ok(Math.abs(lebFn(chebPts(20),chebW(20),.123)-lebFn(chebPts(20),baryW(chebPts(20)),.123))<1e-12);
});
test('Padé contact and CF pure-Chebyshev residuals agree with independent exact cases',()=>{
 const P=pade([1,1,.5,1/6],1,1);assert.deepEqual(P,{p:[1,.5],q:[1,-.5]});assert.equal(pade([0,1,0],0,1),null);
 for(let n=1;n<=5;n++){const a=Array(n+2).fill(0);a[0]=2;a[1]=.3;a[n+1]=1;const c=cfApprox(a,n,numericMath.eigSym,12);for(const x of[-1,-.73,0,.27,1])assert.ok(Math.abs(c.p(x)-(2+.3*x))<1e-10);assert.ok(Math.abs(Math.abs(c.lam)-1)<1e-10);}
 for(let n=2;n<=40;n+=2){const r=newmanAbs(n);assert.equal(r(0),0);assert.ok(Math.abs(r(1)-1)<1e-14);for(const x of[.001,.1,.3,.7])assert.ok(Math.abs(r(x)-r(-x))<1e-14);}
});
import {bary,potEqui} from '../content/num/ch03.shared.js';
test('Runge1901 deviations match the independent exact node-product remainder',()=>{
 const xs=Array.from({length:11},(_,i)=>i-5),w=baryW(xs),f=x=>1/(1+x*x),den=Array.from({length:5},(_,i)=>1+(i+1)**2).reduce((a,b)=>a*b,1);
 for(const x of [.5,4.5,-.5,-4.5]){const exact=Math.abs(x*x*Array.from({length:5},(_,i)=>x*x-(i+1)**2).reduce((a,b)=>a*b,1)/(den*(1+x*x)));const observed=Math.abs(bary(xs,w,xs.map(f),x)-f(x));assert.ok(Math.abs(observed-exact)<1e-12);if(Math.abs(x)===4.5)assert.ok(exact>=1.53);else assert.ok(exact<=.044);}
 const Ui=.5*Math.log(26)-1+.2*Math.atan(5),Ux=x=>((5+x)*Math.log(5+x)+(5-x)*Math.log(5-x)-10)/10;let lo=0,hi=4.9;for(let k=0;k<70;k++){const m=(lo+hi)/2;if(Ux(m)<Ui)lo=m;else hi=m;}assert.ok(Math.abs(lo-3.63)<.005);assert.ok(Math.abs(potEqui(lo/5,0)-potEqui(0,.2))<1e-14);
});
test('rational exp error estimates agree with a denser independent evaluation grid within0.2percent',()=>{
 for(const n of[1,3,5,7,9]){const s=rationalExpBest(n,numericMath.svd);let error=0;for(let i=0;i<=50000;i++){const t=-1+1.999999*i/50000,x=3*(1+t)/(1-t);error=Math.max(error,Math.abs(s.r(x)-Math.exp(-x)));}assert.ok(error/s.E<1.002,`degree${n}: ratio${error/s.E}`);assert.ok(error/s.E>.999);}
});
