// CLIMATE6: global-area equivalent heat reservoirs, years, kelvin anomalies.
// Numerical examples are educational scenarios, never imported observations.
import {rho0} from '../geo/ch01.shared.js';
export const YEAR=365.25*86400,EARTH_AREA=4*Math.PI*6371000**2,OCEAN_AREA=3.6e14;
export const WATER_HEAT=4.1e6;
export const capacity=depth=>WATER_HEAT*depth/YEAR;
export const fmt=x=>x===null?'not defined':x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):Number(x.toPrecision(5)).toString();
export const O={step:'any',sig:5,decimals:5};
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:310,...extra});
export const samples=(fn,a,b,n=200)=>Array.from({length:n+1},(_,i)=>fn(a+(b-a)*i/n));
export function slab(t,{depth=50,lambda=1.2,forcing=3.7}={}){
 const C=capacity(depth),tau=C/lambda,T=forcing/lambda*(-Math.expm1(-t/tau)),N=forcing*Math.exp(-t/tau);
 return {t,C,tau,T,N,equilibrium:forcing/lambda,rate:N/C,heat:C*T};
}
export function thermalParameters({depth=50,deep=1000,lambda=1.2,gamma=.7}={}){
 const C=capacity(depth),Cd=capacity(deep),a=(lambda+gamma)/C,d=gamma/Cd;
 const gap=Math.hypot(a-d,2*gamma/Math.sqrt(C*Cd)),fast=(a+d+gap)/2;
 // Product divided by the large root retains the slow root at weak coupling.
 const slow=gamma===0?0:(lambda/C)*(gamma/Cd)/fast;
 return {C,Cd,lambda,gamma,a,d,fast,slow,gap,fastYears:1/fast,slowYears:slow>0?1/slow:null};
}
const integral=(r,t)=>r===0?t:-Math.expm1(-r*t)/r;
// (L(slow)-L(fast))/(fast-slow), with its noncancelling small-time series.
function dividedIntegral(fast,slow,t){
 if(fast*t<.1){let term=t*t/2,sum=term,power=1;
  for(let n=2;n<18;n++){power=power*fast+slow**(n-1);term=(-1)**(n+1)*power*t**(n+1)/factorial(n+1);sum+=term;}
  return sum;
 }
 return (integral(slow,t)-integral(fast,t))/(fast-slow);
}
function factorial(n){let p=1;for(let i=2;i<=n;i++)p*=i;return p;}
export function twoLayer(t,params={}){
 const p=thermalParameters(params),forcing=params.forcing??3.7;
 if(p.gamma===0){const q=slab(t,{...params,forcing});return {...p,t,forcing,Ts:q.T,Td:0,uptake:0,N:q.N,ds:q.rate,dd:0,heat:q.heat};}
 const wf=(p.a-p.slow)/p.gap,ws=(p.fast-p.a)/p.gap;
 const Ts=forcing/p.C*(wf*integral(p.fast,t)+ws*integral(p.slow,t));
 const Td=forcing/p.C*(p.gamma/p.Cd)*dividedIntegral(p.fast,p.slow,t);
 return thermalBudget(t,Ts,Td,forcing,p);
}
export function thermalBudget(t,Ts,Td,forcing,p){
 const uptake=p.gamma*(Ts-Td),N=forcing-p.lambda*Ts,ds=(N-uptake)/p.C,dd=uptake/p.Cd;
 return {...p,t,forcing,Ts,Td,uptake,N,ds,dd,heat:p.C*Ts+p.Cd*Td};
}
export const zettajoules=heat=>heat*YEAR*EARTH_AREA/1e21;
export const imbalanceFromHeat=(changeZJ,years)=>changeZJ*1e21/(years*YEAR*EARTH_AREA);
export function scenarioForcing(t,{mode='fixed concentration',stop=70,forcing=3.7,carbonYears=80,permanent=.25}={}){
 if(t<=stop)return forcing*t/stop;
 if(mode==='fixed concentration')return forcing;
 // A deliberately prescribed reservoir, not a fitted carbon-cycle model.
 const fraction=permanent+(1-permanent)*Math.exp(-(t-stop)/carbonYears);
 return forcing*Math.log1p(fraction)/Math.LN2;
}
const rk4=(y,t,h,rhs)=>{
 const a=rhs(t,y),b=rhs(t+h/2,y.map((v,i)=>v+h*a[i]/2)),c=rhs(t+h/2,y.map((v,i)=>v+h*b[i]/2)),d=rhs(t+h,y.map((v,i)=>v+h*c[i]));
 return y.map((v,i)=>v+h*(a[i]+2*b[i]+2*c[i]+d[i])/6);
};
export function commitment(params={},max=300,dt=.0625){
 const p=thermalParameters(params),rhs=(t,y)=>{const z=thermalBudget(t,...y,scenarioForcing(t,params),p);return [z.ds,z.dd];};
 const rows=[[0,0,0]];let t=0,y=[0,0];
 while(t<max){const h=Math.min(dt,max-t,(t<(params.stop??70)?(params.stop??70)-t:Infinity));y=rk4(y,t,h,rhs);t+=h;rows.push([t,...y]);}
 function at(time){if(time===0)return thermalBudget(0,0,0,scenarioForcing(0,params),p);let a=0,b=rows.length-1;while(b-a>1){const m=(a+b)>>1;if(rows[m][0]>time)b=m;else a=m;}const r=rows[a],y=rk4(r.slice(1),r[0],time-r[0],rhs);return thermalBudget(time,...y,scenarioForcing(time,params),p);}
 return {params,rows,at,stop:at(params.stop??70),dt};
}
// EOS-80 at one atmosphere, same ITS-90 -> IPTS-68 convention as GEO1.9.
// Evaluate the density difference by polynomial divided differences, retaining
// small warming that would disappear if two rounded densities were subtracted.
export function columnExpansion(T=18,warming=2,depth=200,S=35){
 const t=1.00024*T,delta=1.00024*warming,u=t+delta;
 const c=[999.842594+.824493*S-.00572466*S*Math.sqrt(S)+.00048314*S*S,
 .06793952-.0040899*S+.00010227*S*Math.sqrt(S),
 -.00909529+.000076438*S-.0000016546*S*Math.sqrt(S),
 .0001001685-.00000082467*S,-.000001120083+.0000000053875*S,.000000006536332];
 let divided=0;for(let k=1;k<c.length;k++){let sum=0;for(let j=0;j<k;j++)sum+=u**(k-1-j)*t**j;divided+=c[k]*sum;}
 const density=rho0(S,T),change=delta*divided,finalDensity=density+change;
 return {T,warming,depth,S,density,change,finalDensity,rise:-depth*change/finalDensity,linearAlpha:-1.00024*divided/density};
}
export function seaLevel({years=50,glaciers=250,greenland=250,antarctica=150,thermal=1.2,spread=200}={}){
 const mmPerGt=1e12/(1000*OCEAN_AREA)*1000;
 const rates=[thermal,glaciers*mmPerGt,greenland*mmPerGt,antarctica*mmPerGt],parts=rates.map(r=>r*years),total=parts.reduce((a,b)=>a+b,0),uncertainty=spread*mmPerGt*years;
 return {years,rates,parts,total,uncertainty,low:total-uncertainty,high:total+uncertainty,mmPerGt};
}
// Exact exponential of a real 2x2 matrix, including the repeated-root limit.
export function linearFlow(A,y,t){
 const m=(A[0][0]+A[1][1])/2,q=(A[0][0]-A[1][1])/2,D=q*q+A[0][1]*A[1][0];
 let c,s;if(D>0){const k=Math.sqrt(D);c=Math.cosh(k*t);s=Math.sinh(k*t)/k;}else if(D<0){const k=Math.sqrt(-D);c=Math.cos(k*t);s=Math.sin(k*t)/k;}else{c=1;s=t;}
 const e=Math.exp(m*t);return [e*(c*y[0]+s*(q*y[0]+A[0][1]*y[1])),e*(c*y[1]+s*(A[1][0]*y[0]-q*y[1]))];
}
export function recharge(t,{feedback=.35,delayed=true,seed='warm surface'}={}){
 const a=feedback-.35,b=1.5,c=delayed?1.5:0,d=.2,A=[[a,b],[-c,-d]],initial=seed==='recharged ocean'?[0,1]:[1,0],state=linearFlow(A,initial,t),growth=(a-d)/2,disc=(a+d)**2/4-b*c;
 return {t,A,initial,T:state[0],h:state[1],growth,period:disc<0?2*Math.PI/Math.sqrt(-disc):null,disc};
}
export function seaIce(emissions=500,{area=6,sensitivity=3}={}){
 const loss=sensitivity*emissions/1000,raw=area-loss;
 return {emissions,area,sensitivity,loss,raw,remaining:Math.max(0,raw),zero:area*1000/sensitivity,nearlyIceFree:(area-1)*1000/sensitivity};
}
export function feedbackLoop(t,{wind=1.1,thermocline=1.1,surface=1,closed=true}={}){
 const gain=wind*thermocline*surface,rate=(closed?gain:0)-1,T=Math.exp(rate*t),W=wind*T,H=thermocline*W,returned=surface*H;
 return {t,gain,rate,T,W,H,returned};
}
