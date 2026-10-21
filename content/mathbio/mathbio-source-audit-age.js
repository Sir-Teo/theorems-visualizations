// Audited finite life-table and characteristic-grid calculations; no shared helper changes.
export const total = a => a.reduce((s,x)=>s+x,0);
export const inner = (a,b)=>total(a.map((x,i)=>x*b[i]));
export function lesliePair(F,s){
 const l=[1];for(const p of s)l.push(l.at(-1)*p);
 if(!F.some((x,i)=>x*l[i]>0))return{lam:0,u:null,w:null,l};
 const f=x=>total(F.map((q,i)=>q*l[i]*x**(-i-1)));
 let lo=0,hi=Math.max(1,total(F)+1);while(f(hi)>1)hi*=2;
 for(let k=0;k<160;k++){const x=(lo+hi)/2;if(f(x)>1)lo=x;else hi=x;}
 const lam=(lo+hi)/2,raw=l.map((x,i)=>x*lam**(-i)),u=raw.map(x=>x/total(raw)),w=F.map(()=>0);
 for(let i=F.length-1;i>=0;i--)w[i]=(F[i]+(i<s.length?s[i]*w[i+1]:0))/lam;
 return{lam,u,w,l};
}
export function fourAges(F3,F4,s,steps=40){
 const F=[0,0,F3,F4],p=lesliePair(F,[s,s,s]),starts=[[1,0,0,0],[0,0,0,1],[.1,.2,.3,.4],[.5,0,.5,0]];
 const runs=starts.map(n=>{const out=[];for(let t=0;t<=steps;t++){const mass=total(n),shape=mass>0?n.map(x=>x/mass):null;out.push({mass,shape,d:shape&&p.u?total(shape.map((x,i)=>Math.abs(x-p.u[i]))):null});n=[inner(F,n),s*n[0],s*n[1],s*n[2]];}return out;});
 return{...p,runs,classification:F3>0&&F4>0?'primitive':F4>0?'period 4':F3>0?'period 3 reproductive core; transient class 4':'nilpotent: extinction by census 4'};
}
// Crouse, Crowder & Caswell1987, Table4p1416; individual P/G column scalings below are chosen perturbations.
export const STAGES=['eggs/hatchlings','small juveniles','large juveniles','subadults','novice breeders','first-year remigrants','mature breeders'];
export function auditedTurtle(scales=Array(7).fill(1),fec=1){
 const P=[0,.7370,.6610,.6907,0,0,.8089],G=[.6747,.0486,.0147,.0518,.8091,.8091,0],A=Array.from({length:7},()=>Array(7).fill(0));
 for(let j=0;j<7;j++){const k=Math.min(scales[j],1/(P[j]+G[j]));A[j][j]=P[j]*k;if(j<6)A[j+1][j]=G[j]*k;}A[0][4]=127*fec;A[0][5]=4*fec;A[0][6]=80*fec;return A;
}
export function momentum(R,steps=60){
 const s=[.985,.985,.98,.97,.96,.94,.9,.84,.7],F=[0,0,.7,1.3,1.3,.9,.4,0,0,0],l=[1];for(const p of s)l.push(l.at(-1)*p);
 const Rb=inner(l,F),F1=F.map(x=>x/Rb),F0=F1.map(x=>x*R),E0=lesliePair(F0,s),E1=lesliePair(F1,s),n0=E0.u;
 let n=n0;const runs=[n];for(let t=0;t<steps;t++){n=[inner(F1,n),...s.map((x,i)=>x*n[i])];runs.push(n);}return{E0,E1,n0,runs,N:runs.map(total),reference:runs.map((_,t)=>E0.lam**t),M:inner(E1.w,n0)/inner(E1.w,E1.u)};
}
export const ageSurvival=a=>Math.exp(-.05*a-.000125*a**4);
export const ageFertility=(a,b)=>b*Math.exp(-(((a-5)/1.2)**2)/2);
export function characteristicAges(b,init='young',h=.1,maxAge=12,time=30){
 const na=Math.round(maxAge/h),nt=Math.round(time/h),ages=Array.from({length:na+1},(_,i)=>i*h),ell=ages.map(ageSurvival),beta=ages.map(a=>ageFertility(a,b)),weights=ages.map((_,i)=>h*(i===0||i===na?.5:1));
 const integral=a=>inner(a,weights),f=r=>integral(ages.map((a,i)=>beta[i]*ell[i]*Math.exp(-r*a)));
 let lo=-2,hi=2;while(f(lo)<1)lo*=2;while(f(hi)>1)hi*=2;for(let k=0;k<100;k++){const r=(lo+hi)/2;if(f(r)>1)lo=r;else hi=r;}const r=(lo+hi)/2;
 const stable=ages.map((a,i)=>ell[i]*Math.exp(-r*a)),ms=integral(stable);for(let i=0;i<=na;i++)stable[i]/=ms;
 const boundary=n=>{let z=0;for(let i=1;i<=na;i++)z+=weights[i]*beta[i]*n[i];n[0]=z/(1-weights[0]*beta[0]);};
 let n=ages.map(a=>init==='stable'?0:init==='flat'?1:Math.exp(-((a-(init==='young'?2:8))**2)/1.2));
 if(init==='stable')n=stable.slice();else{boundary(n);const m=integral(n);n=n.map(x=>x/m);}
 const snaps=[n];for(let k=0;k<nt;k++){const nx=Array(na+1).fill(0);for(let i=1;i<=na;i++)nx[i]=n[i-1]*ell[i]/ell[i-1];boundary(nx);snaps.push(nx);n=nx;}
 let maxScaled=0;for(let k=0;k<=nt;k++)for(const q of snaps[k])maxScaled=Math.max(maxScaled,q*Math.exp(-r*k*h));
 return{h,na,nt,ages,ell,beta,weights,r,stable,snaps,maxScaled,masses:snaps.map(integral),births:snaps.map(n=>n[0])};
}
