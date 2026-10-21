// Atlas lattice illustration: pre-mortality adults provide a seed bank for the current update.
const offsetCache=new Map();
function offsets(R,lam,rc){const key=[R,lam,rc].join('|');if(!offsetCache.has(key)){const z=[];for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++)if(dx||dy){const d=Math.hypot(dx,dy);z.push([dx,dy,Math.exp(-d/lam),Math.exp(-((d/rc)**2))]);}offsetCache.set(key,z);}return offsetCache.get(key);}
export function forestWeights(st,i,gamma,{R=7,lam=2,rc=2.5}={}){const{L,S,g}=st,x=i%L,y=Math.floor(i/L),seed=new Float64Array(S),cons=new Float64Array(S);for(const[dx,dy,w,c]of offsets(R,lam,rc)){const s=g[((y+dy+L)%L)*L+(x+dx+L)%L];seed[s]+=w;cons[s]+=c;}for(let s=0;s<S;s++)seed[s]*=Math.exp(-gamma*cons[s]);return seed;}
export function forestStep(st,{gamma,mort=.1,...o}){const old={...st,g:st.g.slice()},dead=[];for(let i=0;i<st.g.length;i++)if(st.rng()<mort)dead.push(i);for(const i of dead){const w=forestWeights(old,i,gamma,o),total=w.reduce((a,b)=>a+b,0);if(!(total>0))throw Error('No local seed source: invalid empty forest');let u=st.rng()*total,pick=0;while(pick<st.S-1&&(w[pick]===0||u>=w[pick])){u-=w[pick];pick++;}st.g[i]=pick;}st.gen++;}
export const parentSeed=d=>Math.exp(-d/2);
export const parentSurvival=(d,gamma)=>Math.exp(-gamma*Math.exp(-((d/2.5)**2)));
export const parentRecruitment=(d,gamma)=>parentSeed(d)*parentSurvival(d,gamma);
export function parentRecruitmentPeak(gamma){const rc=2.5,deriv=d=>-1/2+2*gamma*d/(rc*rc)*Math.exp(-((d/rc)**2));let a=rc/Math.sqrt(2),b=12;if(deriv(a)<=0)return 0;for(let i=0;i<70;i++){const m=(a+b)/2;if(deriv(m)>0)a=m;else b=m;}const d=(a+b)/2;return parentRecruitment(d,gamma)>parentRecruitment(0,gamma)?d:0;}
