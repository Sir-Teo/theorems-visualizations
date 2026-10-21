// Exact finite examples for UML chapter 5. No fitted trend curves.
export function rng(seed) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
export function binomial(n) { let p = [1]; for (let i = 0; i < n; i++) { const q = Array(i + 2).fill(0); p.forEach((x,j) => { q[j] += x / 2; q[j+1] += x / 2; }); p = q; } return p; }
// Distribution of unobserved cells after m independent uniform draws from N cells.
export function unseenLaw(N, m) { let p = Array(N+1).fill(0); p[N] = 1; for(let t=0;t<m;t++){const q=Array(N+1).fill(0);for(let u=0;u<=N;u++){q[u]+=p[u]*(N-u)/N;if(u)q[u-1]+=p[u]*u/N;}p=q;}return p; }
export function nflLaw(m) { const N=2*m, p=Array(N+1).fill(0);unseenLaw(N,m).forEach((w,u)=>binomial(u).forEach((b,k)=>p[k]+=w*b));return p; }
export const levels = [1,2,4,8,16,32];
export function population(noise) { return Array.from({length:32},(_,i)=> ((Math.floor(i/4)%2) ? 1-noise : noise)); }
export function sample(m, noise, seed) { const r=rng(seed), eta=population(noise); return Array.from({length:m},()=>{const x=Math.floor(32*r());return [x, +(r()<eta[x])];}); }
export function fit(K, eta, S) {
 const ones=Array(K).fill(0), counts=Array(K).fill(0), ep=Array(K).fill(0); eta.forEach((p,i)=>ep[Math.floor(i*K/32)]+=p*K/32);
 S.forEach(([x,y])=>{const j=Math.floor(x*K/32);ones[j]+=y;counts[j]++;});
 const prediction=ones.map((o,j)=>+(2*o>counts[j])); // ties and empty cells predict zero
 const risk=eta.reduce((a,p,i)=>a+(prediction[Math.floor(i*K/32)]?1-p:p),0)/32;
 const approximation=ep.reduce((a,p)=>a+Math.min(p,1-p),0)/K;
 const training=S.reduce((a,[x,y])=>a+ +(prediction[Math.floor(x*K/32)]!==y),0)/S.length;
 return {prediction,risk,approximation,estimation:Math.max(0,risk-approximation),training};
}
export function sweep(m,noise,reps=240){const eta=population(noise), risks=levels.map(()=>[]);for(let r=0;r<reps;r++){const S=sample(m,noise,179+104729*r);levels.forEach((K,j)=>risks[j].push(fit(K,eta,S).risk));}return levels.map((K,j)=>{const a=risks[j], mean=a.reduce((s,x)=>s+x,0)/reps, se=Math.sqrt(a.reduce((s,x)=>s+(x-mean)**2,0)/(reps-1)/reps);return {K,mean,se,approximation:fit(K,eta,[[0,0]]).approximation};});}
