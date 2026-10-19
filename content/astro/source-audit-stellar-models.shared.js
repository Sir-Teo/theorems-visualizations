// Explicit educational stellar models, kept separate from catalogue measurements.
import{hydrogenLTE}from'./source-audit-stellar-atmospheres.shared.js';
export function maximizePositive(f,lo,hi){let a=Math.log(lo),b=Math.log(hi);for(let i=0;i<100;i++){const x=a+(b-a)/3,y=b-(b-a)/3;if(f(Math.exp(x))<f(Math.exp(y)))a=x;else b=y;}const T=Math.exp((a+b)/2);return[T,f(T)];}
export function balmerModel(T,Pe){return hydrogenLTE(T,Pe,10);}
export function balmerPeak(Pe){return maximizePositive(T=>balmerModel(T,Pe).n2total,3000,40000);}
export const radiusLuminosity=(T,R)=>R*R*(T/5772)**4;
export const radiusFromTL=(T,L)=>Math.sqrt(L)*(5772/T)**2;
export const MODEL_STARS=[...[[3000,.2],[3400,.4],[4400,.7],[5772,1],[7000,1.5],[10000,2.4],[20000,5],[35000,9]].map(([T,R],i)=>[T===5772?'solar reference':`model MS${i+1}`,T,radiusLuminosity(T,R),'ms']),...[[5000,8],[4300,24],[3600,70],[3600,700],[12000,70]].map(([T,R],i)=>[`model giant${i+1}`,T,radiusLuminosity(T,R),'g']),...[[8000,.013],[16000,.012],[25000,.011]].map(([T,R],i)=>[`model WD${i+1}`,T,radiusLuminosity(T,R),'wd'])];
// Exact visible segment of logL=2logR+4(logT−log5772), with x=−logT.
export function radiusSegment(R,xlo=-4.65,xhi=-3.45,ylo=-4.2,yhi=6.2){const c=2*Math.log10(R)-4*Math.log10(5772),a=Math.max(xlo,(c-yhi)/4),b=Math.min(xhi,(c-ylo)/4);return a<=b?[[a,c-4*a],[b,c-4*b]]:[];}
// Eker et al.2018, Table4 p18: log10(L/Lsun)=a log10(M/Msun)+b.
export const EKER_MLR=[{lo:.179,hi:.45,a:2.028,b:-.976,sigma:.076},{lo:.45,hi:.72,a:4.572,b:-.102,sigma:.109},{lo:.72,hi:1.05,a:5.743,b:-.007,sigma:.129},{lo:1.05,hi:2.4,a:4.329,b:.010,sigma:.140},{lo:2.4,hi:7,a:3.967,b:.093,sigma:.165},{lo:7,hi:31,a:2.865,b:1.105,sigma:.152}];
export function ekerSegment(M){if(M<.179||M>31||!Number.isFinite(M))throw new RangeError('Eker calibration is restricted to0.179–31 solar masses');return EKER_MLR.find(q=>M<=q.hi);}
export function ekerLogLuminosity(M){const q=ekerSegment(M);return q.a*Math.log10(M)+q.b;}
export const fuelTimeProxy=M=>1e10*M*10**(ekerLogLuminosity(1)-ekerLogLuminosity(M));
export function windowRegression(data,x0,x1){const lo=Math.min(x0,x1),hi=Math.max(x0,x1),p=data.filter(p=>p.lm>=lo&&p.lm<=hi),n=p.length;if(n<3)return{n};const mx=p.reduce((s,p)=>s+p.lm,0)/n,my=p.reduce((s,p)=>s+p.ll,0)/n,Sxx=p.reduce((s,p)=>s+(p.lm-mx)**2,0);if(Sxx<1e-20)return{n};const slope=p.reduce((s,p)=>s+(p.lm-mx)*(p.ll-my),0)/Sxx,intercept=my-slope*mx,SSE=p.reduce((s,p)=>s+(p.ll-intercept-slope*p.lm)**2,0);return{n,slope,intercept,se:Math.sqrt(SSE/(n-2)/Sxx),predict:x=>intercept+slope*x};}
export function clipLine(x0,y0,x1,y1,xlo,xhi,ylo,yhi){let lo=0,hi=1;for(const[p,q]of[[-(x1-x0),x0-xlo],[x1-x0,xhi-x0],[-(y1-y0),y0-ylo],[y1-y0,yhi-y0]]){if(p===0){if(q<0)return[];}else if(p<0)lo=Math.max(lo,q/p);else hi=Math.min(hi,q/p);}return lo<=hi?[[x0+lo*(x1-x0),y0+lo*(y1-y0)],[x0+hi*(x1-x0),y0+hi*(y1-y0)]]:[];}
