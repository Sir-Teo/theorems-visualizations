// Educational finite protocol: nearest-image torus, not a periodic elastic Green function.
const clamp = (x,a,b) => Math.min(b,Math.max(a,x));
export const hardeningNu = .3;
export const wrapUnit = x => x - Math.round(x);
export function ensembleRandom(seed) {let a=(seed*2654435761)>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function edgeGlideForce(dx,dy,sign=1) {const r2=dx*dx+dy*dy+1e-12;return sign*dx*(dx*dx-dy*dy)/(r2*r2);}
export function ensembleForces(q,tau=0) {const f=q.s.map(s=>s*tau);for(let i=0;i<q.x.length;i++)for(let j=i+1;j<q.x.length;j++){const p=edgeGlideForce(wrapUnit(q.x[i]-q.x[j]),wrapUnit(q.y[i]-q.y[j]),q.s[i]*q.s[j]);f[i]+=p;f[j]-=p;}return f;}
export function annihilatePairs(q,rc=.015) {let pairs=0;for(let i=0;i<q.x.length;i++)for(let j=i+1;j<q.x.length;j++)if(q.s[i]!==q.s[j]&&Math.abs(q.y[i]-q.y[j])<1e-9&&Math.abs(wrapUnit(q.x[i]-q.x[j]))<rc){for(const k of[j,i])for(const key of['x','y','s'])q[key].splice(k,1);pairs++;i=-1;break;}return pairs;}
export function hardeningProtocol(N,seed,options={}) {
 const refinement=options.refinement??1,dt=4e-5/refinement,relaxSteps=options.relaxSteps??1200*refinement,rampSteps=options.rampSteps??1600*refinement;
 const rng=ensembleRandom(seed),q=options.initial?{x:[...options.initial.x],y:[...options.initial.y],s:[...options.initial.s]}:{x:[],y:[],s:[]};
 if(!options.initial)for(let i=0;i<N;i++){q.x.push(rng());q.y.push(Math.floor(rng()*100)*.01);q.s.push(i%2?1:-1);}
 const copy=()=>({x:[...q.x],y:[...q.y],s:[...q.s]}),init=copy();let slip=0;
 const step=(tau,track=false)=>{const F=ensembleForces(q,tau);for(let i=0;i<q.x.length;i++){const d=clamp(F[i]*dt,-.003,.003);if(track)slip+=q.s[i]*d;q.x[i]=((q.x[i]+d)%1+1)%1;}annihilatePairs(q);};
 for(let k=0;k<relaxSteps;k++)step(0);
 const n0=q.x.length,ell=n0?1/Math.sqrt(n0):null,relaxed=copy(),residual=Math.max(0,...ensembleForces(q).map(Math.abs)),tmax=options.tmax??2.2*Math.sqrt(n0)+1;
 const curve=[];let flow=null;
 for(let k=1;k<=rampSteps;k++){const tau=tmax*k/rampSteps;step(tau,true);const P=n0?slip/(n0*ell):0;if(k%8===0||k===rampSteps)curve.push([tau,P]);if(flow===null&&n0>0&&P>=.25)flow=tau;}
 return{n0,ell,flow,curve,init,relaxed,final:copy(),tmax,residual,slip,status:n0===0?'empty':flow===null?'censored':'crossed',refinement};
}
export const stressUnits = tau => tau/(2*Math.PI*(1-hardeningNu));
export function densityFit(rows){const eligible=rows.filter(p=>p.n>0&&!p.censored&&p.y>0);if(!eligible.length)return null;let xy=0,xx=0;for(const p of eligible){xy+=Math.sqrt(p.n)*p.y;xx+=p.n;}const alpha=xy/xx;const lx=eligible.map(p=>Math.log(p.n)),ly=eligible.map(p=>Math.log(p.y)),mx=lx.reduce((s,x)=>s+x,0)/lx.length,my=ly.reduce((s,y)=>s+y,0)/ly.length;let cov=0,variance=0;for(let i=0;i<lx.length;i++){cov+=(lx[i]-mx)*(ly[i]-my);variance+=(lx[i]-mx)**2;}return{alpha,exponent:variance>1e-14?cov/variance:null,count:eligible.length,censored:rows.filter(p=>p.censored).length};}
