import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../content/prob/ch06.shared.js';
const near = (a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('finite Birkhoff averages and invariant-component means agree with direct orbit enumeration',()=>{
  for(let n=2;n<=15;n++)for(let step=0;step<n;step++){
    const values=Array.from({length:n},(_,j)=>(j*j+3*j)%11-5),components=M.permutationComponents(n,step);
    assert.equal(new Set(components.flat()).size,n);assert.equal(components.flat().length,n);
    for(let x=0;x<n;x++){
      const m=M.birkhoffFinite(values,step,x,10*n),cycle=[];let j=x;
      do{cycle.push(j);j=(j+step)%n;}while(j!==x);
      near(m.limit,cycle.reduce((s,j)=>s+values[j],0)/cycle.length);near(m.averages.at(-1),m.limit);
    }
  }
});
test('maximal ergodic inequality holds for every short ternary observable and permutation shift',()=>{
  for(let n=2;n<=6;n++)for(let code=0;code<3**n;code++){
    let k=code;const values=Array.from({length:n},()=>{const x=k%3-1;k=Math.floor(k/3);return x;});
    for(let step=0;step<n;step++)for(const horizon of[1,3,8]){
      const m=M.maximalErgodicFinite(values,step,horizon);assert.ok(m.integral>=-1e-14);
      for(let x=0;x<n;x++){
        const partial=[];let sum=0;
        for(let t=0;t<horizon;t++){sum+=values[(x+t*step)%n];partial.push(sum);}
        assert.equal(m.maxima[x],Math.max(0,...partial));
      }
    }
  }
});
test('Kac finite returns satisfy the saturation formula, including nonergodic and empty events',()=>{
  for(let n=2;n<=10;n++)for(let step=0;step<n;step++)for(let mask=0;mask<2**n;mask++){
    const m=M.finiteReturns(n,step,mask);
    if(!mask){assert.equal(m.mean,null);assert.equal(m.mass,0);continue;}
    near(m.mass*m.mean,m.saturation);assert.ok(m.returns.every(t=>t>=1&&t<=n));
    if(step===1)near(m.mean,1/m.mass);
  }
});
test('Benford powers use exact integer leading digits and distinguish decimal powers',()=>{
  assert.deepEqual(M.benfordPowers(10).digits,[2,4,8,1,3,6,1,2,5,1]);
  const m=M.benfordPowers(1500);assert.equal(m.counts.reduce((s,x)=>s+x,0),1500);
  for(let k=1;k<=1500;k++){
    const power=2n**BigInt(k);let place=1n;
    while(10n*place<=power)place*=10n;
    assert.equal(m.digits[k-1],Number(power/place));
  }
  near(m.expected.reduce((s,x)=>s+x,0),1);
  assert.deepEqual(M.benfordPowers(100,10).counts,[100,0,0,0,0,0,0,0,0]);
});
test('stationary-increment examples expose component drift and count exactly the post-step range',()=>{
  for(const kind of['iid','mixture','coboundary'])for(const seed of[1,17,900]){
    const m=M.walkRange(400,seed,.5,kind);assert.deepEqual(m,M.walkRange(400,seed,.5,kind));
    for(let k=1;k<=400;k++)assert.equal(m.range[k],new Set(m.path.slice(1,k+1)).size);
    if(kind==='mixture'){assert.equal(m.visits.length,0);assert.equal(m.range.at(-1),400);assert.equal(Math.abs(m.componentMean),1);}
    if(kind==='coboundary'){assert.ok(m.path.every(x=>Math.abs(x)<=1));assert.equal(m.componentMean,0);}
  }
});
function subsequences(a){const all=new Set();for(let mask=0;mask<2**a.length;mask++)all.add(a.filter((_,i)=>mask>>i&1).join(','));return all;}
test('LCS dynamic programming and returned matching pairs agree with exhaustive subsequences',()=>{
  const strings=Array.from({length:64},(_,k)=>Array.from({length:6},(_,i)=>k>>i&1)),sets=strings.map(subsequences);
  for(let i=0;i<64;i++)for(let j=0;j<64;j++){
    const m=M.lcs(strings[i],strings[j]);let best=0;
    for(const s of sets[i])if(sets[j].has(s))best=Math.max(best,s?s.split(',').length:0);
    assert.equal(m.length,best);assert.equal(m.matches.length,best);
    m.matches.forEach(([a,b],k)=>{assert.equal(strings[i][a],strings[j][b]);if(k){assert.ok(a>m.matches[k-1][0]);assert.ok(b>m.matches[k-1][1]);}});
  }
  assert.equal(M.lcs([],[]).length,0);
  for(const seed of[1,19,83]){const a=M.randomLetters(50,4,seed),b=M.randomLetters(50,4,seed+1000);assert.ok(M.lcs(a,b).length>=M.lcs(a.slice(0,20),b.slice(0,20)).length+M.lcs(a.slice(20),b.slice(20)).length);}
});
test('strict increasing-subsequence length matches independent quadratic dynamic programming',()=>{
  for(let n=0;n<=80;n++)for(const seed of[1,17,719]){
    const a=M.randomPermutation(n,seed),m=M.increasingSubsequence(a),dp=Array(n).fill(1);
    assert.equal(new Set(a).size,n);
    for(let i=0;i<n;i++)for(let j=0;j<i;j++)if(a[j]<a[i])dp[i]=Math.max(dp[i],dp[j]+1);
    assert.equal(m.length,Math.max(0,...dp));assert.equal(m.indices.length,m.length);
    for(let k=1;k<m.length;k++)assert.ok(m.indices[k]>m.indices[k-1]&&a[m.indices[k]]>a[m.indices[k-1]]);
  }
  assert.equal(M.increasingSubsequence([1,1,1,1]).length,1);
});
test('renormalized positive-matrix products preserve direct infinity norm and avoid overflow',()=>{
  for(const p of[0,.13,.5,1])for(const seed of[1,43,719]){
    const m=M.positiveMatrixProduct(30,seed,p);let A=[[1,0],[0,1]];
    for(let k=0;k<30;k++){
      const B=m.matrices[m.choices[k]];
      A=A.map(row=>B[0].map((_,j)=>row[0]*B[0][j]+row[1]*B[1][j]));
      near(m.logNorms[k+1],Math.log(Math.max(...A.map(row=>row[0]+row[1]))));
    }
    const long=M.positiveMatrixProduct(4000,seed,p);assert.ok(long.rates.every(Number.isFinite));near(Math.max(...long.normalized.map(row=>row[0]+row[1])),1);
  }
});
test('finite-box first-passage distances equal independent Bellman-Ford relaxation and path costs',()=>{
  for(const width of[3,5,9])for(const height of[3,5])for(const seed of[1,19,71]){
    const m=M.passageGrid(width,height,seed),d=Array(width*height).fill(Infinity);d[m.source]=0;
    for(let k=1;k<d.length;k++)for(const {a,b,weight}of m.edges){d[b]=Math.min(d[b],d[a]+weight);d[a]=Math.min(d[a],d[b]+weight);}
    d.forEach((x,i)=>near(m.distances[i],x));let cost=0;
    for(let k=1;k<m.path.length;k++){const a=m.path[k-1],b=m.path[k],e=m.edges.find(e=>e.a===a&&e.b===b||e.b===a&&e.a===b);assert.ok(e);cost+=e.weight;}
    near(cost,m.distances[m.target]);assert.ok(cost>=.5*(width-1));assert.ok(cost<=1.5*(width-1));
  }
});

import A from '../content/prob/ch06.js';
import B from '../content/prob/ch06-b.js';
import C from '../content/prob/ch06-c.js';
import syllabus from '../content/prob/syllabus.js';
test('seventeen source-numbered items match the chapter syllabus and retain explicit synthetic-definition flags',()=>{
 const items=[...A.items,...B.items,...C.items],planned=syllabus.chapters.find(c=>c.n===6).items;
 assert.equal(items.length,17);assert.deepEqual(items.map(i=>[i.num,i.kind,i.deps]),planned.map(i=>[i.num,i.kind,i.deps]));
 for(const item of items){for(const k of['statement','idea','caption','scope'])assert.ok(item[k].length>70);assert.equal(typeof item.viz,'function');assert.ok(item.links.source.endsWith('PTE5_011119.pdf'));}
 assert.deepEqual(items.filter(i=>i.verify).map(i=>i.num),['6.1.1a','6.1.4a']);
});
test('rational cached orbit is exactly periodic in represented states; irrational orbit bin counts match an independent floor oracle',()=>{
 for(const x of[0,.17,1-Number.EPSILON]){const r=M.rotationOrbit(.2,x,1500,16,5);assert.equal(new Set(r.orbit).size,5);for(let i=5;i<1500;i++)assert.equal(r.orbit[i],r.orbit[i%5]);}
 for(const alpha of[Math.SQRT2-1,(Math.sqrt(5)-1)/2])for(const start of[0,.317]){const r=M.rotationOrbit(alpha,start,500),counts=Array(16).fill(0);for(let i=0;i<500;i++)counts[Math.floor(16*((start+i*alpha)%1))]++;assert.deepEqual(r.counts,counts);}
});
test('stationary Gaussian/Markov initializations and conditional mixture means distinguish ensemble from component',()=>{
 const n=5000;for(const kind of['ar','markov','mixture']){let first=0,late=0;for(let seed=1;seed<=n;seed++){const a=M.stationaryTrace(kind,11,seed,.73);assert.ok(a.every(Number.isFinite));first+=a[0];late+=a[10];}const target=kind==='markov'?.4:0;assert.ok(Math.abs(first/n-target)<.08);assert.ok(Math.abs(late/n-target)<.08);}
 for(const seed of[1,17,41]){const d=M.walkRange(100,seed,.5,'mixture');assert.equal(d.path[100],100*d.componentMean);assert.equal(d.visits.length,0);assert.equal(d.range[100],100);}
});
test('three explicit subadditive cost families satisfy all finite splits and advertised rate limits',()=>{
 for(const b of[2,5,12])for(const C of[1,3])for(const f of[k=>Math.sqrt(k),k=>Math.ceil(k/b),k=>C*k+Math.sqrt(k)])for(let n=2;n<150;n++)for(let m=1;m<n;m++)assert.ok(f(m)+f(n-m)>=f(n)-1e-12);
 near(Math.ceil(1000000/5)/1000000,.2);near((3*1000000+Math.sqrt(1000000))/1000000,3.001);
});
test('joint-coupling mixture preserves IID marginal finite-word laws while retaining invariant information',()=>{
 // Enumerate all binary words of length3: half identical coupling, half independent.
 const words=Array.from({length:8},(_,i)=>Array.from({length:3},(_,j)=>i>>j&1));let one=0;
 for(const x of words){let massX=0;for(const y of words){const prob=(x.join('')===y.join('')?.5/8:0)+.5/64;massX+=prob;if(x.join('')===y.join(''))one+=prob;}near(massX,1/8);}
 near(one,.5+.5/8);for(const x of words)assert.equal(M.lcs(x,x).length,3);
 // A union bound gives an exponential upper bound for independent near-perfect matches.
 const entropy=x=>-x*Math.log(x)-(1-x)*Math.log(1-x);assert.ok(2*entropy(.99)-.99*Math.log(2)<0);
});
test('Poisson arrival areas equal an independent exponential-sum oracle and side transformation',()=>{
 for(const seed of[1,17,99]){const d=M.poissonArrivalScale(2000,seed),rng=M.random(seed);let sum=0;for(let k=1;k<=2000;k++){sum+=-Math.log1p(-rng());near(d.area[k-1],sum,1e-8);near(d.times[k-1]**2,d.area[k-1],1e-8);near(d.ratios[k-1],d.times[k-1]/Math.sqrt(k));if(k>1)assert.ok(d.times[k-1]>d.times[k-2]);}}
});
