// CLIMATE5: explicitly scoped reductions; temperatures in Celsius unless marked K.
export const O={step:'any',decimals:4},I={step:1,int:true};
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:310,...extra});
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const latitude=x=>Math.asin(clamp(x,0,1))*180/Math.PI;
export const insolation=x=>1-.482*(3*x*x-1)/2;
export const sunIntegral=x=>1.241*x-.241*x*x*x;
export const horizontal=(s,y,o={})=>s.line(s.xr[0]+3/Math.abs(s.sx),y,s.xr[1]-3/Math.abs(s.sx),y,{width:1.3,...o});
export const vertical=(s,x,o={})=>s.line(x,s.yr[0]+3/Math.abs(s.sy),x,s.yr[1]-3/Math.abs(s.sy),{width:1.3,...o});
export function bisect(f,a,b,tol=1e-12){let fa=f(a);if(Math.abs(fa)<tol)return a;if(Math.abs(f(b))<tol)return b;for(let j=0;j<70;j++){const m=(a+b)/2,fm=f(m);if(Math.abs(fm)<tol||b-a<tol)return m;if(fa*fm<=0)b=m;else{a=m;fa=fm;}}return(a+b)/2;}
export function interpolate(xs,ys,x){if(x<=xs[0])return ys[0];if(x>=xs.at(-1))return ys.at(-1);let a=0,b=xs.length-1;while(b-a>1){const m=(a+b)>>1;if(xs[m]>x)b=m;else a=m;}return ys[a]+(ys[b]-ys[a])*(x-xs[a])/(xs[b]-xs[a]);}
export const EBM={A:210,B:2,Tc:-10,ao:.3,ai:.62,Q:1365.2/4};
// No-flux finite volumes in equal-area x=sin(latitude). Integrate the step
// albedo times the quadratic sunlight over each cell, including the cut cell.
export function ebmProfile(eta,mu=1,D=.55,N=960,forcing=0){
 const {A,B,ao,ai,Q}=EBM,h=1/N,x=Array.from({length:N},(_,j)=>(j+.5)*h),a=new Float64Array(N),b=new Float64Array(N),c=new Float64Array(N),rhs=new Float64Array(N),sw=new Float64Array(N),T=new Float64Array(N),cp=new Float64Array(N),dp=new Float64Array(N);
 for(let j=0;j<N;j++){const lo=j*h,hi=(j+1)*h,cut=clamp(eta,lo,hi),warm=sunIntegral(cut)-sunIntegral(lo),all=sunIntegral(hi)-sunIntegral(lo),left=j?D*(1-lo*lo)/(h*h):0,right=j===N-1?0:D*(1-hi*hi)/(h*h);sw[j]=mu*Q*((1-ai)*all+(ai-ao)*warm)/h;a[j]=-left;b[j]=B+left+right;c[j]=-right;rhs[j]=sw[j]-A+forcing;}
 for(let j=0;j<N;j++){const den=b[j]-(j?a[j]*cp[j-1]:0);cp[j]=c[j]/den;dp[j]=(rhs[j]-(j?a[j]*dp[j-1]:0))/den;}
 T[N-1]=dp[N-1];for(let j=N-2;j>=0;j--)T[j]=dp[j]-cp[j]*T[j+1];
 // Regularity at the equator; linear endpoint extrapolation at the degenerate pole.
 const at=z=>z<=x[0]?T[0]:z>=x.at(-1)?T[N-1]+(z-x[N-1])*(T[N-1]-T[N-2])/h:interpolate(x,T,z);
 let residual=0,energy=0;for(let j=0;j<N;j++){const r=a[j]*(j?T[j-1]:0)+b[j]*T[j]+c[j]*(j<N-1?T[j+1]:0)-rhs[j];residual=Math.max(residual,Math.abs(r));energy+=(sw[j]-A+forcing-B*T[j])/N;}
 const flux=Array.from({length:N+1},(_,j)=>j===0||j===N?0:-D*(1-(j*h)**2)*(T[j]-T[j-1])/h);
 return{x,T:Array.from(T),sw:Array.from(sw),flux,at,edge:at(eta),mean:T.reduce((s,z)=>s+z,0)/N,residual,energy};
}
// The branch diagram and quasistatic projection use the SAME piecewise-linear
// edge-response table, not an assumed S curve. N and M refinements are testable.
const ebmCache=new Map();
export function ebmBranches(D=.55,N=960,M=360){
 const key=`${D}|${N}|${M}`;if(ebmCache.has(key))return ebmCache.get(key);
 const eta=Array.from({length:M+1},(_,j)=>Math.sin(Math.PI*j/(2*M))),k=eta.map(e=>(ebmProfile(e,1,D,N).edge+EBM.A/EBM.B)/EBM.Q),numerator=EBM.Tc+EBM.A/EBM.B;
 const solar=k.map(z=>numerator/(EBM.Q*z)),edge=(e,mu,F=0)=>mu*EBM.Q*interpolate(eta,k,e)-EBM.A/EBM.B+F/EBM.B;
 const roots=(mu,F=0)=>{
  const g=k.map(z=>mu*EBM.Q*z-EBM.A/EBM.B+F/EBM.B-EBM.Tc),tol=32*Number.EPSILON*(1+Math.abs(mu*EBM.Q)*Math.max(...k)+Math.abs(EBM.A/EBM.B)+Math.abs(F/EBM.B)+Math.abs(EBM.Tc)),zero=g.map(z=>Math.abs(z)<=tol),out=[];
  if(g[0]<-tol||zero[0]){const stable=zero[0]?(Math.abs(g[1])<=tol?null:g[1]<0):true;out.push({eta:0,stable,boundary:true,threshold:zero[0],attractLeft:false,attractRight:stable===true});}
  for(let j=1;j<M;j++)if(zero[j]){const left=(g[j]-g[j-1])/(eta[j]-eta[j-1]),right=(g[j+1]-g[j])/(eta[j+1]-eta[j]),attractLeft=g[j-1]>tol,attractRight=g[j+1]<-tol,repelLeft=g[j-1]<-tol,repelRight=g[j+1]>tol,stable=attractLeft&&attractRight?true:repelLeft&&repelRight?false:null;out.push({eta:eta[j],stable,slope:stable===null?0:(left+right)/2,leftSlope:left,rightSlope:right,attractLeft,attractRight,type:stable===null?'semistable / marginal':stable?'attracting':'repelling'});}
  for(let j=0;j<M;j++)if(!zero[j]&&!zero[j+1]&&g[j]*g[j+1]<0){const e=eta[j]-g[j]*(eta[j+1]-eta[j])/(g[j+1]-g[j]),stable=g[j+1]<g[j];out.push({eta:e,stable,slope:(g[j+1]-g[j])/(eta[j+1]-eta[j]),attractLeft:stable,attractRight:stable});}
  if(g[M]>tol||zero[M]){const stable=zero[M]?(Math.abs(g[M-1])<=tol?null:g[M-1]>0):true;out.push({eta:1,stable,boundary:true,threshold:zero[M],attractLeft:stable===true,attractRight:false});}
  return out.sort((a,b)=>a.eta-b.eta);
 };
 const settle=(e,mu,F=0)=>{const g=edge(e,mu,F)-EBM.Tc;if(e===0&&g<=0||e===1&&g>=0||Math.abs(g)<1e-12)return e;const r=roots(mu,F);if(g>0)return r.find(z=>z.eta>=e-1e-12&&z.attractLeft)?.eta??1;return r.findLast(z=>z.eta<=e+1e-12&&z.attractRight)?.eta??0;};
 const folds=[];for(let j=1;j<M;j++)if((solar[j]-solar[j-1])*(solar[j+1]-solar[j])<0)folds.push({eta:eta[j],mu:solar[j],type:solar[j]<solar[j-1]?'minimum':'maximum'});
 const result={eta,k,solar,edge,roots,settle,folds,D,N,M};if(ebmCache.size>=6)ebmCache.delete(ebmCache.keys().next().value);ebmCache.set(key,result);return result;
}
export function ebmCycle(D=.55,lo=.82,hi=1.55,steps=180){const b=ebmBranches(D),out=[];let eta=1;for(let j=0;j<=2*steps;j++){const mu=j<=steps?hi-(hi-lo)*j/steps:lo+(hi-lo)*(j-steps)/steps;eta=b.settle(eta,mu);out.push({mu,eta,leg:j<=steps?'cooling':'warming'});}return out;}
// Exact carbon bookkeeping before an imposed radiative threshold; no high-CO2
// radiation extrapolation. c is a dimensionless carbon inventory, time is arbitrary.
export function carbonEscape(t,V=.12,W=.02,threshold=2){const x=W*t,phi=x===0?1:-Math.expm1(-x)/x,c=Math.exp(-x)+V*t*phi,canReach=V>W*threshold,gap=V-W*threshold,z=canReach?W*(threshold-1)/gap:0,hit=threshold<=1?0:!canReach?Infinity:(threshold-1)/gap*(z===0?1:Math.log1p(z)/z);return{c,hit,reached:c>=threshold,rate:V-W*c,limit:W===0?Infinity:V/W};}
export function daisyState(a,b,L=1,contrast=1){const sigma=5.67e-8,S=917,Aw=.5+.25*contrast,Ab=.5-.25*contrast,A=.5*(1-a-b)+Aw*a+Ab*b,Te4=S*L*(1-A)/sigma,qSigma=.1*S,Ta=(Te4+qSigma*(A-Aw)/sigma)**.25-273,Tb=(Te4+qSigma*(A-Ab)/sigma)**.25-273,beta=T=>T<=5||T>=40?0:Math.max(0,1-.003265*(22.5-T)**2),x=1-a-b,ga=x*beta(Ta)-.3,gb=x*beta(Tb)-.3;return{A,Te:Te4**.25-273,Ta,Tb,da:a*ga,db:b*gb,ga,gb,bare:(S*L*.5/sigma)**.25-273};}
// RK4 with finite positive steps; return conservation/positivity defects rather
// than clipping/reseeding or declaring finite time a steady state.
export function daisyTrajectory(L=1,contrast=1,end=100,dt=.05,a0=.05,b0=.05){let a=a0,b=b0,min=1,maxSum=0;const path=[[0,a,b,daisyState(a,b,L,contrast).Te]],steps=Math.ceil(end/dt),h=steps?end/steps:0;for(let j=0;j<steps;j++){const f=(a,b)=>{const z=daisyState(a,b,L,contrast);return[z.da,z.db];},k1=f(a,b),k2=f(a+h*k1[0]/2,b+h*k1[1]/2),k3=f(a+h*k2[0]/2,b+h*k2[1]/2),k4=f(a+h*k3[0],b+h*k3[1]);a+=h*(k1[0]+2*k2[0]+2*k3[0]+k4[0])/6;b+=h*(k1[1]+2*k2[1]+2*k3[1]+k4[1])/6;min=Math.min(min,a,b);maxSum=Math.max(maxSum,a+b);if(j%Math.max(1,Math.floor(steps/400))===0||j===steps-1)path.push([(j+1)*h,a,b,daisyState(a,b,L,contrast).Te]);}const z=daisyState(a,b,L,contrast);return{a,b,...z,path,min,maxSum,residual:Math.max(Math.abs(z.da),Math.abs(z.db))};}
// Frozen-parameter normal form xdot=r-x², stable x=sqrt(r); exact OU sampling
// of its linearization. The random draw is deliberately independent of browser APIs.
export function recovery(r,sigma=.1,lag=1){const rate=2*Math.sqrt(r);return{rate,tau:1/rate,variance:sigma*sigma/(2*rate),corr:Math.exp(-rate*lag),scale:sigma/Math.sqrt(2*rate)};}
export function ouSample(r,sigma=.1,seed=42,n=1600,dt=.25){const st=recovery(r,sigma,dt);let state=seed>>>0;const rand=()=>{state=(1664525*state+1013904223)>>>0;return(state+.5)/4294967296;},normal=()=>Math.sqrt(-2*Math.log(rand()))*Math.cos(2*Math.PI*rand());let z=normal()*st.scale;const xs=[z],gain=st.scale*Math.sqrt(-Math.expm1(-2*st.rate*dt));for(let j=1;j<n;j++){z=st.corr*z+gain*normal();xs.push(z);}const mean=xs.reduce((a,b)=>a+b,0)/n,variance=xs.reduce((s,z)=>s+(z-mean)**2,0)/n,cov=xs.slice(1).reduce((s,z,j)=>s+(z-mean)*(xs[j]-mean),0)/(n-1);return{...st,xs,mean,measuredVariance:variance,measuredCorr:cov/variance};}
// All nonnegative real roots of a cubic on a known finite interval: split at
// derivative zeros, retaining tangencies within a scale-aware residual tolerance.
export function cubicRoots(a,b,c,d,max){const f=x=>((a*x+b)*x+c)*x+d,disc=b*b-3*a*c,cuts=[0,max];if(disc>=0){for(const z of[(-b-Math.sqrt(disc))/(3*a),(-b+Math.sqrt(disc))/(3*a)])if(z>0&&z<max)cuts.push(z);}cuts.sort((a,b)=>a-b);const out=[],add=z=>{if(!out.some(v=>Math.abs(v-z)<1e-8))out.push(z);};for(const z of cuts)if(Math.abs(f(z))<=1e-12*(1+Math.abs(a*z**3)+Math.abs(b*z*z)+Math.abs(c*z)+Math.abs(d)))add(z);for(let j=1;j<cuts.length;j++)if(f(cuts[j-1])*f(cuts[j])<0)add(bisect(f,cuts[j-1],cuts[j]));return out.sort((a,b)=>a-b);}
export function stommelRhs(x,y,R=2,delta=1/6,lambda=.2){const f=(R*x-y)/lambda,g=Math.abs(f);return{f,dx:delta*(1-x)-g*x,dy:1-y-g*y};}
export function stommelEquilibria(R=2,delta=1/6,lambda=.2){const out=[];for(const s of[-1,1]){const zs=cubicRoots(lambda/delta,lambda*(1+1/delta),lambda+s*(1/delta-R),s*(1-R),Math.max(1,R)/lambda);for(const z of zs){const f=s*z||0,x=1/(1+z/delta),y=1/(1+z),rhs=stommelRhs(x,y,R,delta,lambda);if(out.some(v=>Math.abs(v.f-f)<1e-8))continue;const J=z===0?null:[[-delta-z-x*s*R/lambda,x*s/lambda],[-y*s*R/lambda,-1-z+y*s/lambda]],trace=J?J[0][0]+J[1][1]:null,det=J?J[0][0]*J[1][1]-J[0][1]*J[1][0]:null,discriminant=J?trace*trace-4*det:null,marginal=J&&Math.abs(det)<1e-9*(1+J.flat().reduce((v,q)=>v+q*q,0)),type=!J?'nonsmooth zero-flow':marginal?'marginal':det<0?'saddle':det>0&&trace<0?(discriminant<0?'stable spiral':'stable node'):det>0&&trace>0?'unstable':'marginal';out.push({f,x,y,J,trace,det,type,residual:Math.max(Math.abs(rhs.dx),Math.abs(rhs.dy),Math.abs(rhs.f-f))});}}return out.sort((a,b)=>a.f-b.f);}
export function iceSheetRoots(a=-.3,c=1,m=8){const hc=(c/m)**(1/(m-1)),ac=-(m-1)*hc**m,f=h=>a+c*h-h**m,roots=[];if(f(hc)>1e-12){if(a<0){const base=-a/c;let h=base;for(let j=0;j<80;j++){const q=h**(m-1),den=c-m*q,next=h+(h*q-c*(h-base))/den;if(!(next>h)||!Number.isFinite(next))break;h=Math.min(next,hc);}roots.push({h,stable:false,unresolved:base===0});}let hi=Math.max(2,hc*2);while(f(hi)>0)hi*=2;roots.push({h:bisect(f,hc,hi),stable:true});}else if(Math.abs(f(hc))<=1e-12)roots.push({h:hc,stable:null});if(a<=0)roots.unshift({h:0,stable:a<0,boundary:true});return{roots,hc,ac,rate:f};}
// Budyko's ORIGINAL nonlocal transport coefficients (kcal cm^-2 month^-1).
// The quadratic sunlight/step cover here are authored, not his tabulated inputs.
export function budyko(eta,mu=1,beta=.235){const A=12.5,B=.09,Q=1.92*43800/4000,absorbed=Q*mu*(.38+.30*sunIntegral(eta)),mean=(absorbed-A)/B,temperature=(x,alpha)=> (Q*mu*insolation(x)*(1-alpha)-A+beta*mean)/(B+beta),edge=temperature(eta,.50),referenceEta=Math.sin(72*Math.PI/180),refAbs=Q*(.38+.3*sunIntegral(referenceEta)),refMean=(refAbs-A)/B,target=(Q*insolation(referenceEta)*.5-A+beta*refMean)/(B+beta);return{mean,edge,target,temperature,Q,absorbed,imbalance:absorbed-A-B*mean,edgeResidual:edge-target};}
