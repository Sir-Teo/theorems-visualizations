import{rng}from'../../assets/js/viz/math.js';
export const FOUNDER_LOCI=400,FOUNDER_RUNS=20;
export const geneDiversity=p=>p.reduce((s,q)=>s+2*q*(1-q),0)/p.length;
export function founderModel(N=10,K=16,seed=3){
  if(!Number.isInteger(N)||N<2||N>200||!Number.isInteger(K)||K<3||K>24||!Number.isInteger(seed)||seed<0||seed>9999)throw new RangeError('Integer founder size2–200, steps3–24 and seed0–9999 required');
  const start=rng(seed*977+1),p0=Array.from({length:FOUNDER_LOCI},()=>.01+.49*(1-Math.cos(Math.PI*start()))),H0=geneDiversity(p0),runs=[];
  for(let c=0;c<FOUNDER_RUNS;c++){
    const random=rng(seed*977+N*13+c*104729+1);let p=p0.slice();const hs=[H0];
    for(let k=1;k<=K;k++){
      p=p.map(q=>{let count=0;for(let i=0;i<2*N;i++)if(random()<q)count++;return count/(2*N);});hs.push(geneDiversity(p));
    }runs.push({hs,pEnd:p});
  }
  const mean=Array.from({length:K+1},(_,k)=>runs.reduce((s,r)=>s+r.hs[k],0)/FOUNDER_RUNS),expected=Array.from({length:K+1},(_,k)=>H0*(1-1/(2*N))**k);
  const histogram=p=>{const h=Array(10).fill(0);for(const q of p)h[Math.min(9,Math.floor(10*q))]++;return h.map(n=>n/FOUNDER_LOCI);};
  return{N,K,seed,p0,H0,runs,mean,expected,initialHist:histogram(p0),finalHist:histogram(runs[0].pEnd),fixed:runs[0].pEnd.filter(q=>q===0||q===1).length/FOUNDER_LOCI};
}
