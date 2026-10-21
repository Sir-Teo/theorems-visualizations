import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {extinction,pgf,genDist,simGen,uSeq,returnedBy,simWalkersZd,cumOf,growTree,preorder} from '../content/stoch/ch03.shared.js';
import {stationary,vecP,arborescences,treeWeight,binom} from '../content/stoch/ch04.shared.js';
import {WATSON_BINOMIAL,WATSON_TERNARY,cycleChain,cycleLogRatio,AUDIT_CYCLES,treeChain,ehrenfestBandTime,ehrenfestReturns,evenCdfSteps} from '../content/stoch/source-audit.shared.js';
const near=(a,b,e=2e-12)=>assert.ok(Math.abs(a-b)<=e,`${a} ≠ ${b}`),rng=s=>()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/2**32;};
const refs=JSON.parse(readFileSync(new URL('../docs/verification/stoch-sources-references.json',import.meta.url)));
test('least extinction root includes deterministic exceptions and near-critical binary laws',()=>{
 for(let j=0;j<=1000;j++){const a=j/1000;near(extinction([a,0,1-a]),a>=.5?1:a/(1-a));}
 for(const a of [.5-1e-10,.5-1e-13,.5+1e-13])near(extinction([a,0,1-a]),a>=.5?1:a/(1-a),5e-16);
 assert.equal(extinction([0,1,0]),0);assert.equal(extinction([0,0,0,1]),0);assert.equal(extinction([1,0]),1);
 near(extinction(WATSON_BINOMIAL),.5527186703412417,8e-15);near(pgf(WATSON_BINOMIAL,extinction(WATSON_BINOMIAL)),extinction(WATSON_BINOMIAL));assert.equal(extinction(WATSON_TERNARY),1);
 near(extinction(WATSON_BINOMIAL),+refs.watson.leastRoot,2e-16);let x=0;refs.watson.orbit.forEach((q,i)=>{if(i)x=pgf(WATSON_BINOMIAL,x);near(x,+q,6e-16);});
});
// Independent distribution evolution: convolve offspring for each parent population, rather than compose PGFs.
function generations(p,G){let z=[0,1];for(let g=0;g<G;g++){const out=Array((z.length-1)*(p.length-1)+1).fill(0);let offspring=[1];for(let n=0;n<z.length;n++){if(n){const q=Array(offspring.length+p.length-1).fill(0);offspring.forEach((a,i)=>p.forEach((b,j)=>q[i+j]+=a*b));offspring=q;}offspring.forEach((a,k)=>out[k]+=z[n]*a);}z=out;}return z;}
test('finite family coefficients agree with independently convolved generation laws and censored paths stay unknown',()=>{
 for(const p of [[.5,0,.5],[.2,.5,.3],[0,1],[1]])for(let g=0;g<=5;g++){const full=generations(p,g),cut=genDist(p,g,10);cut.forEach((x,k)=>near(x,full[k]||0));near(full.reduce((a,b)=>a+b,0),1);}
 assert.deepEqual(simGen(cumOf([0,0,0,0,0,1]),()=>.5,5,20),[1,5,25,NaN,NaN,NaN]);assert.deepEqual(simGen(cumOf([0,1]),()=>.5,4,20),[1,1,1,1,1]);assert.deepEqual(simGen(cumOf([1]),()=>.5,4,20),[1,0,0,0,0]);
 const cropped=growTree([0,0,0,1],()=>.5,5,8),order=preorder(cropped);assert.equal(cropped[0].childCount,3);let S=0;for(const id of order){if(cropped[id].childCount===undefined)break;S+=cropped[id].childCount-1;assert.ok(S>=0);}assert.ok(cropped.some(n=>n.childCount===undefined));
});
// Independent integer path counts with origin killed after time zero yield first-hit counts directly.
function lattice(d,T,kill){let m=new Map([[Array(d).fill(0).join(','),1n]]),counts=[1n];for(let t=1;t<=T;t++){const next=new Map();for(const [key,c]of m){const x=key.split(',').map(Number);for(let a=0;a<d;a++)for(const step of [-1,1]){const y=x.slice();y[a]+=step;const k=y.join(',');next.set(k,(next.get(k)||0n)+c);}}const zero=Array(d).fill(0).join(',');counts.push(next.get(zero)||0n);if(kill)next.delete(zero);m=next;}return counts;}
test('Pólya finite return CDFs match exact lattice-path enumeration in all displayed dimensions',()=>{
 for(let d=1;d<=3;d++){const all=lattice(d,16,false),first=lattice(d,16,true),u=uSeq(d,8),{F,f}=returnedBy(u);let cumulative=0;for(let n=1;n<=8;n++){near(u[n],Number(all[2*n])/((2*d)**(2*n)));const hit=Number(first[2*n])/((2*d)**(2*n));near(f[n],hit);cumulative+=hit;near(F[n],cumulative);}const steps=evenCdfSteps(F);for(let t=0;t<=16;t++){const valid=steps.filter(([x])=>x<=t).at(-1);near(valid[1],F[Math.floor(t/2)]);}const sim=simWalkersZd(rng(123),d,500,80,true);assert.ok(Array.from(sim.first).every(x=>x===0||x%2===0));}
});
function allCycles(n){const out=[];for(let start=0;start<n;start++){const path=[start];function dfs(){if(path.length>=3&&path[1]<path.at(-1))out.push(path.slice());for(let j=start+1;j<n;j++)if(!path.includes(j)){path.push(j);dfs();path.pop();}}dfs();}return out;}
test('cycle criterion display has the exact analytic log ratios for all 37 simple cycles',()=>{
 const cycles=allCycles(5);assert.equal(cycles.length,37);const plus=new Set(['0,1','1,2','2,0']),minus=new Set(['1,0','2,1','0,2']);
 for(let seed=1;seed<=20;seed++)for(const theta of [0,.05,.6,1.5]){const P=cycleChain(rng(seed),theta),pi=stationary(P);P.forEach(r=>near(r.reduce((a,b)=>a+b),1));for(const c of cycles){let twist=0;for(let i=0;i<c.length;i++){const key=c[i]+','+c[(i+1)%c.length];twist+=plus.has(key)?1:minus.has(key)?-1:0;}near(cycleLogRatio(P,c),2*theta*twist);}near(cycleLogRatio(P,AUDIT_CYCLES[0]),6*theta);near(cycleLogRatio(P,AUDIT_CYCLES[2]),0);if(theta===0)P.forEach((r,i)=>r.forEach((p,j)=>near(pi[i]*p,pi[j]*P[j][i])));else assert.ok(cycleLogRatio(P,AUDIT_CYCLES[0])>.2);}
});
const det3=A=>A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])-A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])+A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]);
test('all four root tree sums match independent principal determinants for 100 weighted chains',()=>{
 for(let seed=1;seed<=100;seed++){const P=treeChain(rng(seed)),L=P.map((r,i)=>r.map((p,j)=>(i===j?1:0)-p));const W=P.map((_,r)=>arborescences(P,r).reduce((s,t)=>s+treeWeight(P,t),0));for(let r=0;r<4;r++){const I=[0,1,2,3].filter(i=>i!==r);near(W[r],det3(I.map(i=>I.map(j=>L[i][j]))));}const total=W.reduce((a,b)=>a+b),pi=W.map(w=>w/total);vecP(pi,P).forEach((x,i)=>near(x,pi[i]));stationary(P).forEach((x,i)=>near(x,pi[i]));}
 const tiny=[[1-1e-15,1e-15],[.4,.6]];assert.equal(arborescences(tiny,1).length,1);near(treeWeight(tiny,arborescences(tiny,1)[0]),1e-15,1e-30);
});
test('Ehrenfest parity obstruction, mean-band threshold and return sampling are explicit',()=>{
 for(const [N,r]of Object.entries(refs.ehrenfestMeanBand))assert.equal(ehrenfestBandTime(+N),r.firstInteger);
 for(const N of [4,5,12,20,60]){const pi=Array.from({length:N+1},(_,k)=>binom(N,k)/2**N);let law=Array(N+1).fill(0);law[N]=1;const band=ehrenfestBandTime(N);near(pi.reduce((s,x)=>s+x,0),1,1e-10);for(let k=0;k<N;k++)near(pi[k]*(N-k)/N,pi[k+1]*(k+1)/N);near(pi.filter((_,k)=>k%2===0).reduce((a,b)=>a+b,0),.5,1e-10);for(let t=0;t<=Math.max(100,band+1);t++){const mean=law.reduce((s,x,k)=>s+k*x,0);near(mean,N/2+N/2*(1-2/N)**t,2e-11);const tv=.5*law.reduce((s,x,k)=>s+Math.abs(x-pi[k]),0);assert.ok(tv>=.5-1e-11);const next=Array(N+1).fill(0);law.forEach((x,k)=>{if(k>0)next[k-1]+=x*k/N;if(k<N)next[k+1]+=x*(N-k)/N;});law=next;}assert.ok(N/2*(1-2/N)**band<=Math.sqrt(N)+1e-12);if(band>0)assert.ok(N/2*(1-2/N)**(band-1)>Math.sqrt(N));}
 for(let N=2;N<=12;N++){const r=ehrenfestReturns(N,rng(1000+N));assert.equal(r.censored,0);assert.ok(Math.abs(r.mean-2**N)<8*r.se+1e-8);}
 const censored=ehrenfestReturns(5,()=>.999,4,1);assert.equal(censored.censored,4);assert.equal(censored.mean,1);
});
