import test from 'node:test';
import assert from 'node:assert/strict';
import {finitePairProbabilities,coinMixtureSample,inclusiveHistogram,arcsineCdf,arcsineBinDensity,plotStepCdf,exactChoose} from '../content/prob/ch04-exchangeability.shared.js';
import {u2n,polyaSeqProb,betaPdf,betaMoment} from '../content/prob/ch04-z.shared.js';
const close=(a,b,e=2e-13)=>assert.ok(Math.abs(a-b)<e,`${a} vs ${b}`);
test('conditional first-pair probabilities: exhaustive finite exchangeable populations',()=>{
 for(let n=2;n<=12;n++)for(let k=0;k<=n;k++){
  const counts=[0,0,0];let total=0;
  for(let mask=0;mask<2**n;mask++)if(mask.toString(2).replaceAll('0','').length===k){total++;const a=mask&1,b=(mask>>1)&1;counts[a&&b?0:a||b?1:2]++;}
  finitePairProbabilities(k,n).forEach((p,i)=>close(p,counts[i]/total));
 }
 // A wide window needs E(theta^2), and finite counts have a further without-replacement correction.
 const p=[finitePairProbabilities(1,4),finitePairProbabilities(3,4)];close((p[0][0]+p[1][0])/2,.25);
 assert.notEqual((.25**2+.75**2)/2,.5**2);
});
test('mixture n=5 still generates all eight coordinates for run moments',()=>{
 let calls=0;const draws=[.1,.1,.1,.1,.1,.1,.1,.1];const s=coinMixtureSample(()=>{calls++;return draws.shift();},.5,5);
 assert.deepEqual(s,{frequency:1,run:8});assert.equal(calls,8);
 let i=0;const t=coinMixtureSample(()=>[.1,.9,.1,.1,.1,.1,.1,.1][i++],.5,5);assert.equal(t.frequency,.8);assert.equal(t.run,1);
 const probabilities=new Map();for(let mask=0;mask<256;mask++){let j=0;const sample=coinMixtureSample(()=>((mask>>j++)&1)?.1:.9,.5,5);probabilities.set(sample.run,(probabilities.get(sample.run)||0)+1);}
 for(let k=1;k<=8;k++)close([...probabilities].filter(([r])=>r>=k).reduce((s,[,c])=>s+c,0)/256,2**-k);
});
test('all finite Pólya sequence probabilities equal sequential rule and normalize',()=>{
 for(const [a,b] of [[.5,.5],[.5,6],[6,.5],[2,1],[6,6]])for(let n=1;n<=8;n++){
  let total=0;for(let mask=0;mask<2**n;mask++){let red=a,blue=b,p=1,k=0;for(let j=0;j<n;j++){const x=(mask>>j)&1;p*=x?red/(red+blue):blue/(red+blue);if(x){red++;k++;}else blue++;}close(p,polyaSeqProb(a,b,k,n));total+=p;}close(total,1);
 }
});
test('reflection counts and initial-segment involution for every short endpoint',()=>{
 for(let n=0;n<=10;n++)for(let x=1;x<=5;x++){
  const counts=new Map();for(let mask=0;mask<2**n;mask++){let s=x;const path=[s];for(let i=0;i<n;i++){s+=(mask>>i)&1?1:-1;path.push(s);}if(s<=0)continue;const first=path.indexOf(0);if(first<0)continue;counts.set(s,(counts.get(s)||0)+1);
   const reflected=path.map((v,i)=>i<=first?-v:v);assert.equal(reflected[0],-x);assert.equal(reflected[n],s);assert.ok(reflected.slice(1).every((v,i)=>Math.abs(v-reflected[i])===1));assert.deepEqual(reflected.map((v,i)=>i<=first?-v:v),path);
  }
  for(let y=1;y<=n+x;y++)assert.equal(counts.get(y)||0,exactChoose(n,(n+y+x)/2));
 }
});
test('both discrete arcsine laws by complete independent enumeration, including zero-edge convention',()=>{
 for(let n=1;n<=8;n++){
  const last=new Array(n+1).fill(0),above=new Array(n+1).fill(0);
  for(let mask=0;mask<2**(2*n);mask++){let s=0,L=0,A=0;for(let i=1;i<=2*n;i++){const old=s;s+=(mask>>(i-1))&1?1:-1;if(s===0)L=i;if((old+s)/2>0)A++;}assert.equal(A%2,0);last[L/2]++;above[A/2]++;}
  for(let k=0;k<=n;k++){const p=u2n(k)*u2n(n-k);close(last[k]/2**(2*n),p);close(above[k]/2**(2*n),p);}
 }
 for(const n of [5,25,100,400,1000]){const law=Array.from({length:n+1},(_,k)=>u2n(k)*u2n(n-k));close(law.reduce((a,b)=>a+b),1,2e-10);}
});
test('arcsine bin masses integrate to one, CDF paths jump vertically, histogram includes both endpoints',()=>{
 const ds=arcsineBinDensity(30);close(ds.reduce((a,b)=>a+b)/30,1);close(arcsineCdf(.5),.5);close(arcsineCdf(.55)-arcsineCdf(.45),.06376856085851991);
 let path;plotStepCdf({path:p=>{path=p;}},[.25,.5,.25],'accent');assert.deepEqual(path,[[0,0],[0,0],[0,.25],[.5,.25],[.5,.75],[1,.75],[1,1]]);
 for(let i=1;i<path.length;i++)assert.ok(path[i][0]===path[i-1][0]||path[i][1]===path[i-1][1]);
 const h=inclusiveHistogram([-100,0,1,20],-100,20,40);assert.equal(h.counts.reduce((a,b)=>a+b),4);close(h.density.reduce((a,b)=>a+b)*3,1);
});
test('Wald equality by exhaustive asymmetric-step stopped-tree summation',()=>{
 // Law {-1:2/3,+2:1/3}, mean zero, and biased +/-1 law, mean 1/3.
 for(const [steps,probs] of [[[-1,2],[2/3,1/3]],[[-1,1],[1/3,2/3]]])for(const level of [1,3,8]){
  const mu=steps.reduce((s,x,i)=>s+x*probs[i],0);let ES=0,EN=0,mass=0;
  const branch=(s,n,p)=>{if(s>=level||n===12){ES+=p*s;EN+=p*n;mass+=p;return;}steps.forEach((x,i)=>branch(s+x,n+1,p*probs[i]));};branch(0,0,1);close(mass,1,2e-12);close(ES,mu*EN,2e-12);
 }
});
test('reverse running means have the required conditional means on every finite sum fibre',()=>{
 for(let n=1;n<=10;n++){
  const sums=new Map();for(let mask=0;mask<2**(n+1);mask++){let S=0;for(let i=0;i<=n;i++)S+=(mask>>i)&1?1:-1;const xn=(S-((mask>>n)&1?1:-1))/n;const v=sums.get(S)||[0,0];v[0]+=xn;v[1]++;sums.set(S,v);}
  for(const [S,[sum,count]]of sums)close(sum/count,S/(n+1));
 }
});

test('Beta density and moments against independent factorial / half-factorial integrals',()=>{
 const gamma=z=>{let x=z%1===0?1:Math.sqrt(Math.PI);for(let t=z%1===0?1:.5;t<z;t++)x*=t;return x;};
 const beta=(a,b)=>gamma(a)*gamma(b)/gamma(a+b);
 for(const [a,b]of [[.5,.5],[.5,6],[6,.5],[6,6],[2,1],[20,60],[60,20]]){
  for(const x of [.004,.02,.2,.5,.8,.98,.996]){const exact=x**(a-1)*(1-x)**(b-1)/beta(a,b);assert.ok(Math.abs(betaPdf(a,b,x)/exact-1)<2e-12);}
  for(let k=1;k<=8;k++)close(betaMoment(a,b,k),beta(a+k,b)/beta(a,b),2e-12);
 }
});
