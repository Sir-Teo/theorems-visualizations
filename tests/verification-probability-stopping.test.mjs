import test from 'node:test';
import assert from 'node:assert/strict';
import {gamblingSystems,predictableFailures,stoppingRules,exactUpcrossingWalk,doobWalkDecomposition,polyaFiniteLaw,discreteKolmogorov} from '../content/prob/ch04-stopping.shared.js';
import {offspringLaw} from '../content/prob/ch04-m.shared.js';
const near=(x,y,tol=1e-11)=>assert.ok(Math.abs(x-y)<=tol,`${x} != ${y}`);
const path=(mask,N)=>{const S=[0];for(let j=0;j<N;j++)S.push(S[j]+(mask&(1<<j)?1:-1));return S;};
test('predictability: exhaustive common-past checks and every current-round peek failure',()=>{
 for(const key of ['flat','dbl','chase'])assert.deepEqual(predictableFailures(gamblingSystems[key].H),[]);
 assert.deepEqual(predictableFailures(gamblingSystems.peek.H),Array.from({length:12},(_,i)=>i+1));
 for(let mask=0;mask<4096;mask++){const xi=path(mask,12).slice(1).map((x,i)=>x-path(mask,12)[i]);near(xi.reduce((s,e,i)=>s+gamblingSystems.peek.H(xi,i+1)*e,0),2*xi.filter(x=>x>0).length);}
});
test('stopping-time rules: every finite walk/prefix, plus explicit future-dependent witnesses',()=>{
 const N=10,rules=stoppingRules(N);
 for(const key of ['hit4','back'])for(let n=0;n<=N;n++){
  const seen=new Map();for(let mask=0;mask<2**N;mask++){const p=path(mask,N),pre=mask&((1<<n)-1),flag=rules[key].N(p)===n;if(seen.has(pre))assert.equal(flag,seen.get(pre));else seen.set(pre,flag);}
 }
 const up=path(2**N-1,N),down=path(0,N),back=path(2**N-2,N); // same S_0; different futures.
 assert.equal(rules.last0.N(up),0);assert.ok(rules.last0.N(back)>0);
 assert.equal(rules.argmax.N(down),0);assert.ok(rules.argmax.N(up)>0);
 assert.equal(rules.hit4.N(down),Infinity);
});
test('upcrossing probability recursion matches independent enumeration of all short walks',()=>{
 for(const p of [.5,.6,.7])for(const [a,b]of[[-2,3],[0,1],[2,5],[-5,-2]]){
  const got=exactUpcrossingWalk(12,p,a,b);
  for(let n=0;n<=12;n++){
   let e=0,pos=0;for(let mask=0;mask<2**n;mask++){
    const S=path(mask,n),wins=(S[n]+n)/2,w=p**wins*(1-p)**(n-wins);let start=-1,count=0;
    for(let i=0;i<=n;i++){if(start<0&&S[i]<=a)start=i;else if(start>=0&&S[i]>=b){count++;start=-1;}}
    e+=w*count;pos+=w*Math.max(S[n]-a,0);
   }near(got.EU[n],e);near(got.bound[n],(pos-Math.max(-a,0))/(b-a));
  }
 }
 for(const p of [.5,.6,.7])for(const [a,b]of[[-15,-14],[-2,3],[13,14]]){
  const q=exactUpcrossingWalk(200,p,a,b);for(let n=0;n<=200;n++)assert.ok(q.bound[n]+2e-12>=q.EU[n]);
 }
});
test('Doob decomposition: conditional fairness for every prefix; unbiased local-time and quadratic compensators',()=>{
 for(const p of [.3,.5,.7])for(const g of [Math.abs,x=>x*x,x=>Math.max(0,x),x=>-Math.abs(x)]){
  for(let mask=0;mask<256;mask++){
   const S=path(mask,8),d=doobWalkDecomposition(S,g,p);for(let n=0;n<=8;n++)near(d.Xs[n],d.Ms[n]+d.As[n]);
   const s=S[8],up=doobWalkDecomposition([...S,s+1],g,p),dn=doobWalkDecomposition([...S,s-1],g,p);near(p*up.Ms[9]+(1-p)*dn.Ms[9],d.Ms[8]);near(up.As[9],dn.As[9]);
  }
 }
 const S=path(173,12),abs=doobWalkDecomposition(S,Math.abs,.5),sq=doobWalkDecomposition(S,x=>x*x,.5);let visits=0;
 for(let n=1;n<=12;n++){visits+=S[n-1]===0;near(abs.As[n],visits);near(sq.As[n],n);}
});
test('Pólya finite law agrees with independent sequential urn recursion, moments, histogram and atomic KS',()=>{
 for(const b of [1,2,10])for(const r of [1,3,10])for(const n of [5,20,100,500,1000]){
  const got=polyaFiniteLaw(b,r,n);let pk=[1];for(let t=0;t<n;t++){const next=new Array(pk.length+1).fill(0);for(let k=0;k<pk.length;k++){next[k+1]+=pk[k]*(b+k)/(b+r+t);next[k]+=pk[k]*(r+t-k)/(b+r+t);}pk=next;}
  let m=0,v=0;for(let k=0;k<=n;k++){near(got.pmf[k],pk[k],2e-13);m+=got.pmf[k]*got.support[k];}for(let k=0;k<=n;k++)v+=got.pmf[k]*(got.support[k]-m)**2;
  near(m,got.mean);near(v,got.variance);near(got.hist().reduce((a,b)=>a+b,0),1);
 }
 const law=polyaFiniteLaw(1,1,5);for(const p of law.pmf)near(p,1/6);near(discreteKolmogorov(law.support,law),0);
 near(discreteKolmogorov([law.support[0]],law),5/6);
});
test('branching displayed offspring laws: normalization, mean, PGF, negligible truncation tails',()=>{
 for(const kind of ['poisson','binary','geom'])for(let j=0;j<=36;j++){
  const m=.2+j*.05,L=offspringLaw(kind,m);near(L.p.reduce((a,b)=>a+b,0),1);near(L.mean,m,5e-13);near(L.pgf(1),1);
  near(L.pgf(.7),kind==='binary'?1-m/2+m/2*.7**2:kind==='geom'?1/(1+m*(1-.7)):Math.exp(m*(.7-1)),5e-14);
  if(kind==='geom'){const q=m/(1+m);assert.ok(q**L.p.length<2e-15);}
  if(kind==='poisson'){let tailTerm=Math.exp(-m);for(let k=1;k<=L.p.length;k++)tailTerm*=m/k;assert.ok(tailTerm/(1-m/(L.p.length+1))<2e-15);}
 }
});
