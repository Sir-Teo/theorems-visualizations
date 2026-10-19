import {binomTail} from './ch05.shared.js';
/** Monotone symmetric jury equilibrium, including mixing after either signal and limiting pure corners.
 * q = signal accuracy; pi = guilt prior; z = posterior conviction threshold.
 */
export function juryEquilibrium(n,k,q,pi,z){
 const odds=Math.log(q/(1-q)), target=Math.log(z/(1-z))-Math.log(pi/(1-pi));
 const low=target-odds, high=target+odds, sincere=(2*k-n-1)*odds;
 let guilty=1, innocent=0;
 // The pivotal likelihood ratio falls as either conviction probability rises.
 if(sincere>high){
  const end=-(n-k)*odds;
  if(high<=end)innocent=1;
  else{let lo=0,hi=1;for(let j=0;j<65;j++){
   const b=(lo+hi)/2,ag=q+(1-q)*b,ai=1-q+q*b;
   const L=(k-1)*Math.log(ag/ai)+(n-k)*Math.log((1-q)/q);
   if(L>high)lo=b;else hi=b;
  }innocent=(lo+hi)/2;}
 }else if(sincere<low){
  const end=(k-1)*odds;
  if(low>=end)guilty=0;
  else{let lo=0,hi=1;for(let j=0;j<65;j++){
   const a=(lo+hi)/2,ag=q*a,ai=(1-q)*a;
   const L=(k-1)*odds+(n-k)*Math.log((1-ag)/(1-ai));
   if(L>low)lo=a;else hi=a;
  }guilty=(lo+hi)/2;}
 }
 const aG=q*guilty+(1-q)*innocent,aI=(1-q)*guilty+q*innocent;
 return {guilty,innocent,rho:innocent,ci:binomTail(n,k,aI),ag:Math.max(0,1-binomTail(n,k,aG))};
}
/** Correct maximum number in either open half-plane through x; allows coincident ideals. */
export function maxOpenHalfplane(V,x){
 const a=V.filter(p=>Math.hypot(p[0]-x[0],p[1]-x[1])>1e-9).map(p=>Math.atan2(p[1]-x[1],p[0]-x[0])).sort((a,b)=>a-b);
 if(!a.length)return 0;
 const b=a.concat(a.map(v=>v+2*Math.PI));let max=0,j=0;
 for(let i=0;i<a.length;i++){j=Math.max(j,i);while(j<i+a.length&&b[j]-b[i]<Math.PI-1e-9)j++;max=Math.max(max,j-i);}
 return max;
}

/** Distribution of D = (votes for A) - (votes for B) from independent voters: voters = [[pA, pB], ...] plus a fixed shift. Returns { off, p }. */
export function diffDist(voters, shift = 0) {
  const M = voters.length + Math.abs(shift) + 1, off = M;
  let p = new Float64Array(2 * M + 1); p[off + shift] = 1;
  for (const [a, b] of voters) {
    const r = new Float64Array(2 * M + 1), c = 1 - a - b;
    for (let i = 1; i < 2 * M; i++) { const x = p[i]; if (x === 0) continue; r[i + 1] += x * a; r[i - 1] += x * b; r[i] += x * c; }
    p = r;
  }
  return { off, at: (d) => { const i = off + d; return i >= 0 && i < p.length ? p[i] : 0; } };
}

/**
 * Swing-voter model. Two equally likely states, A and B. Informed voters (nI) vote for the right candidate with probability q;
 * partisans (a for A, b for B) always vote for their candidate; the other independents (nU uninformed) vote A, B or abstain.
 * Gain in expected utility of one uninformed independent from voting A (resp. B) instead of abstaining, when the other nU-1 use (al, be).
 */
export function gains(nI, q, a, b, nU, al, be) {
  const out = {};
  const D = { A: null, B: null };
  for (const s of ['A', 'B']) {
    const vs = [];
    for (let i = 0; i < nI; i++) vs.push(s === 'A' ? [q, 1 - q] : [1 - q, q]);
    for (let j = 0; j < nU - 1; j++) vs.push([al, be]);
    D[s] = diffDist(vs, a - b);
  }
  const gA = 0.25 * ((D.A.at(0) + D.A.at(-1)) - (D.B.at(0) + D.B.at(-1)));
  const gB = 0.25 * (-(D.A.at(0) + D.A.at(1)) + (D.B.at(0) + D.B.at(1)));
  return { gA, gB };
}
/** Candidate symmetric strategy from exponential weights; returned regret measures failure of the equilibrium conditions. */
export function swingEq(nI, q, a, b, nU) {
  let s = [1 / 3, 1 / 3, 1 / 3];
  for (let it = 0; it < 500; it++) {
    const { gA, gB } = gains(nI, q, a, b, nU, s[0], s[1]);
    const w = [s[0] * Math.exp(40 * gA), s[1] * Math.exp(40 * gB), s[2]], Z = w[0] + w[1] + w[2];
    s = w.map((x) => x / Z);
  }
  const {gA,gB}=gains(nI,q,a,b,nU,s[0],s[1]);
  const regret=Math.max(0,gA,gB)-s[0]*gA-s[1]*gB;
  return { al: s[0], be: s[1], ab: s[2], regret };
}


/** Unique peak with strict monotonicity on either side; cross-side indifference is permitted. */
export function isStrictSinglePeaked(u){
 const k=u.indexOf(Math.max(...u));
 return u.every((v,i)=>i<k?v<u[i+1]:i>k?v<u[i-1]:true);
}
