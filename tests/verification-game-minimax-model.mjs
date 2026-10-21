import test from 'node:test';
import assert from 'node:assert/strict';
import { solveZS, triPt } from '../content/game/ch03.shared.js';
import { rng } from '../assets/js/viz/math.js';
import { lpGameCertificate, fictitiousPlay, fictitiousBounds, FICTITIOUS_GAMES } from '../content/game/minimax-audit.js';
const near = (x,y,e=1e-9) => assert.ok(Math.abs(x-y)<=e*Math.max(1,Math.abs(y)),`${x} != ${y}`);
const total = a => a.reduce((x,y)=>x+y,0);
const det = A => A.length===1 ? A[0][0] : A[0].reduce((s,x,j)=>s+(-1)**j*x*det(A.slice(1).map(r=>r.filter((_,k)=>j!==k))),0);
function subsets(n,k,start=0,prefix=[],out=[]) { if (!k) out.push(prefix); else for(let i=start;i<=n-k;i++) subsets(n,k-1,i+1,[...prefix,i],out); return out; }
// Independent vertex enumeration by Cramer's rule, not the production tableau/pivot path.
function vertexValue(A) {
  const n=A[0].length,s=1-Math.min(...A.flat()),B=A.map(r=>r.map(x=>x+s));
  const constraints=[...B,...Array.from({length:n},(_,j)=>Array.from({length:n},(_,k)=>j===k?-1:0))],rhs=[...B.map(()=>1),...Array(n).fill(0)];let best=0;
  for(const ids of subsets(constraints.length,n)) { const M=ids.map(i=>constraints[i]),b=ids.map(i=>rhs[i]),d=det(M);if(Math.abs(d)<1e-12)continue;
    const z=Array.from({length:n},(_,j)=>det(M.map((r,i)=>r.map((x,k)=>k===j?b[i]:x)))/d);
    if(constraints.every((r,i)=>total(r.map((x,j)=>x*z[j]))<=rhs[i]+1e-9))best=Math.max(best,total(z));
  }
  assert.ok(best>0);return 1/best-s;
}
function auditPrefix(A,run,value) {
  const m=A.length,n=A[0].length,rows=Array(m).fill(0),cols=Array(n).fill(0);
  for(let s=0;s<run.horizon;s++) {
    const [i,j]=run.actions[s],rowScores=A.map(r=>total(r.map((x,k)=>x*cols[k])));
    assert.equal(i,rowScores.indexOf(Math.max(...rowScores)),`row's previous column prefix t=${s+1}`);
    const columnPrefix=rows.slice();if(run.mode==='alternating')columnPrefix[i]++;
    const columnScores=A[0].map((_,k)=>total(A.map((r,l)=>r[k]*columnPrefix[l])));
    assert.equal(j,columnScores.indexOf(Math.min(...columnScores)),`column's ${run.mode} row prefix t=${s+1}`);
    rows[i]++;cols[j]++;const t=s+1;
    rows.forEach((x,k)=>near(run.X[s][k],x/t));cols.forEach((y,k)=>near(run.Y[s][k],y/t));
    const lower=Math.min(...A[0].map((_,k)=>total(A.map((r,l)=>r[k]*rows[l]/t)))),upper=Math.max(...A.map(r=>total(r.map((x,k)=>x*cols[k]/t))));
    near(run.lo[s],lower);near(run.hi[s],upper);assert.ok(lower<=value+1e-9 && upper>=value-1e-9);
  }
}
test('positive-shift LP certificate agrees with independent vertex values for all offered seeds and rectangular/degenerate games',()=>{
  const cases=[[[5]],[[0,0],[0,0]],[[-3,-3,-3],[-3,-3,-3]],[[1,-1],[-1,1]],[[2,-3],[-1,4]],[[2,2,5],[2,2,4],[0,1,3]],[[1,-5,3]],[[1],[-5],[3]],...Object.values(FICTITIOUS_GAMES).map(g=>g.A)];
  for(let seed=1;seed<=128;seed++){const r=rng(seed*101+3);cases.push(Array.from({length:3},()=>Array.from({length:3},()=>r.int(-5,5))));}
  for(const A of cases){const S=solveZS(A),c=lpGameCertificate(A,S);assert.ok(c.ok,JSON.stringify({A,c}));near(S.v,vertexValue(A));near(c.primal,c.dual);near(c.lower,S.v);near(c.upper,S.v);assert.ok(c.minB>0);}
});
test('numerical certification rejects invalid shift, primal/dual feasibility, normalization, value and objective defects',()=>{
  const A=FICTITIOUS_GAMES.fixed.A,S=solveZS(A),bad=mutate=>{const s=structuredClone(S);mutate(s);assert.equal(lpGameCertificate(A,s).ok,false);};
  bad(s=>s.s=0);bad(s=>s.z[0]=-.1);bad(s=>s.w[0]=0);bad(s=>s.z=s.z.map(x=>x*2));bad(s=>s.w=s.w.map(x=>x*2));bad(s=>s.x=[1,0,0]);bad(s=>s.y=[0,0,0]);bad(s=>s.v+=1);bad(s=>s.z=[]);bad(s=>s.v=NaN);
  assert.throws(()=>lpGameCertificate([],S));assert.throws(()=>lpGameCertificate(A,S,0));
});
test('normalization is invariant under positive affine payoff changes, including negative shifts',()=>{
  const A=[[2,-3],[-1,4]],S=solveZS(A);
  for(const [a,b]of[[7,-31],[.125,19],[1,100]]){const M=A.map(r=>r.map(x=>a*x+b)),s=solveZS(M);assert.ok(lpGameCertificate(M,s).ok);near(s.v,a*S.v+b);s.x.forEach((x,i)=>near(x,S.x[i]));s.y.forEach((x,i)=>near(x,S.y[i]));}
  assert.ok(solveZS([[5,5],[5,5]]).s<0);
});
test('both Robinson timings satisfy every independently recomputed best-response prefix and security bracket through round4000',()=>{
  for(const {A}of Object.values(FICTITIOUS_GAMES))for(const mode of['simultaneous','alternating'])auditPrefix(A,fictitiousPlay(A,4000,mode),vertexValue(A));
  const A=[[1,-1],[-1,1]];assert.deepEqual(fictitiousPlay(A,1).actions,[[0,0]]);assert.deepEqual(fictitiousPlay(A,1,'alternating').actions,[[0,1]]);
  for(const A of[[[5]],[[0,0],[0,0]],[[3,-4,1]],[[-3],[2],[1]]])for(const mode of['simultaneous','alternating'])auditPrefix(A,fictitiousPlay(A,100,mode),vertexValue(A));
});
test('nonmonotone prefix witnesses, complete endpoints and full-range bounds are preserved',()=>{
  let lowerDrop=false,upperRise=false;
  for(const {A}of Object.values(FICTITIOUS_GAMES))for(const mode of['simultaneous','alternating']){
    const run=fictitiousPlay(A,4000,mode),b=fictitiousBounds(run,vertexValue(A));assert.equal(run.actions.length,4000);assert.equal(run.X.length,4000);assert.ok(b.x[0]<1&&b.x[1]>4000);
    for(let s=0;s<4000;s++){assert.ok(run.lo[s]>b.y[0]&&run.hi[s]<b.y[1]);assert.ok(triPt(run.X[s]).every(Number.isFinite));if(s){lowerDrop ||= run.lo[s]<run.lo[s-1]-1e-10;upperRise ||= run.hi[s]>run.hi[s-1]+1e-10;}}
  }assert.ok(lowerDrop);assert.ok(upperRise);
});
test('model rejects malformed matrices, unsupported timing and invalid horizons',()=>{
  for(const A of[[],[[]],[[1],[2,3]],[[Infinity]],[[NaN]]])assert.throws(()=>fictitiousPlay(A,1));
  for(const t of[0,-1,1.5,100001,Infinity])assert.throws(()=>fictitiousPlay([[1]],t));assert.throws(()=>fictitiousPlay([[1]],1,'mystery'));
});
