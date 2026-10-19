import test from 'node:test';import assert from 'node:assert/strict';
import{replicateDriftNext,replicateDriftPaths}from'../content/popgen/drift-replicates.shared.js';
import{binomPmf,lfact}from'../content/popgen/ch02.shared.js';
const near=(a,b,e=1e-10)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
function pmf(k,p,Ne){if(p===0)return k===0?1:0;if(p===1)return k===32?1:0;if(Ne===16)return binomPmf(32,k,p);const c=32*(2*Ne-1)/(32-2*Ne);let l=lfact(32)-lfact(k)-lfact(32-k);for(let i=0;i<k;i++)l+=Math.log(p*c+i);for(let i=0;i<32-k;i++)l+=Math.log((1-p)*c+i);for(let i=0;i<32;i++)l-=Math.log(c+i);return Math.exp(l);}
function rng(seed){let z=seed;const r=()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return(z+.5)/4294967296;};r.normal=()=>Math.sqrt(-2*Math.log(r()))*Math.cos(2*Math.PI*r());return r;}
test('a full census-count beta-binomial distribution has the requested neutral drift moments',()=>{for(const Ne of[4,9,11.5,16])for(const p of[1/32,.5,31/32]){const mass=Array.from({length:33},(_,k)=>pmf(k,p,Ne));near(mass.reduce((a,b)=>a+b),1);near(mass.reduce((s,m,k)=>s+m*k/32,0),p);near(mass.reduce((s,m,k)=>s+m*(k/32-p)**2,0),p*(1-p)/(2*Ne));}});
test('the actual sampler agrees with independent distribution moments and keeps absorbing boundaries',()=>{for(const Ne of[4,11.5,16])for(const k of[1,16]){const r=rng(1956+k+100*Ne),N=70000;let sum=0,sq=0;for(let i=0;i<N;i++){const a=replicateDriftNext(r,k,Ne);assert.ok(Number.isInteger(a)&&a>=0&&a<=32);sum+=a/32;sq+=(a/32)**2;}const p=k/32,v=p*(1-p)/(2*Ne);near(sum/N,p,6*Math.sqrt(v/N));near(sq/N-(sum/N)**2,v,.0005+v*.05);assert.equal(replicateDriftNext(r,0,Ne),0);assert.equal(replicateDriftNext(r,32,Ne),32);}});
test('independent transition-matrix evolution gives the exact relative-diversity curve',()=>{for(const Ne of[4,11.5,16]){let p=new Array(33).fill(0);p[16]=1;for(let t=0;t<=19;t++){near(p.reduce((s,m,k)=>s+m*k/32,0),.5);near(p.reduce((s,m,k)=>s+m*2*(k/32)*(1-k/32),0)/.5,(1-1/(2*Ne))**t,1e-9);const q=new Array(33).fill(0);for(let j=0;j<33;j++)for(let k=0;k<33;k++)q[k]+=p[j]*pmf(k,j/32,Ne);p=q;}}});
test('replicate series use their actual line counts and thirty-two integer census copies',()=>{for(const[L,Ne]of[[107,9],[105,11.5]]){const paths=replicateDriftPaths(rng(1234),L,Ne);assert.equal(paths.length,L);for(const p of paths){assert.equal(p.length,20);assert.equal(p[0],16);for(let t=1;t<20;t++){assert.ok(Number.isInteger(p[t])&&p[t]>=0&&p[t]<=32);if(p[t-1]===0||p[t-1]===32)assert.equal(p[t],p[t-1]);}}}});
const {KIMURA_1968,kimuraBudget,diversityModel}=await import('../content/popgen/historical-models.shared.js');
test('Kimura original nucleotide conversion includes the synonymous correction and four-year generations',()=>{
 const k=KIMURA_1968;near(k.rate,1/(28e6)*1.2/300);const m=kimuraBudget(k.genome,k.rate,k.generation,k.cost,k.load);near(1/m.perYear,1.75);near(m.perGen,16/7);near(1/m.limit,300);near(m.amax,.1/(30*(16/7)));
 for(const[G,r,g,D,L]of[[1e8,1e-11,.5,3,.5],[1e10,1e-9,30,100,.01]]){const b=kimuraBudget(G,r,g,D,L);assert.ok(b.amax>0&&b.amax<=1);assert.ok(b.amax*b.perGen*D<=L+1e-12);if(b.amax<1)near(b.amax*b.perGen*D,L);}
});
test('finite-sites diversity respects probability saturation and an explicitly chosen effective-size ceiling',()=>{
 const raw=diversityModel(1e9,1e-8);near(raw.theta,40);assert.ok(raw.pi<.75&&raw.pi>0);for(const N of[10,1e6,1e12]){const d=diversityModel(N,1.2e-8,1e6);assert.ok(d.ne<N&&d.ne<1e6);near(1/d.ne,1/N+1e-6);near(1/d.pi,1/d.theta+4/3,1e-7);}
 near(.0801/.0001,801);near(.0066/.0021,22/7);near(2.1e-3*100,.21);
});
