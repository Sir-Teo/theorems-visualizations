// Chapter5 engineering transform: X(w)=∫x(t)e^(-iwt)dt; inverse carries1/(2π).
import{erf,erfc}from'../../assets/js/viz/math.js';
export{erf,erfc};
export const TAU=2*Math.PI,SQRTPI=Math.sqrt(Math.PI),SQRTTAU=Math.sqrt(TAU);
export const I={int:true,step:1},O={step:'any',decimals:4};
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],scale=(a,c)=>[a[0]*c,a[1]*c],mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]],conj=a=>[a[0],-a[1]],abs=a=>Math.hypot(...a),cis=x=>[Math.cos(x),Math.sin(x)];
export const positive=x=>{if(!Number.isFinite(x)||x<=0)throw Error('Positive finite parameter required');return x;};
export function sinc(x){if(x===0)return 1;if(Math.abs(x)<.01){const y=x*x;return 1-y/6+y*y/120-y*y*y/5040+y**4/362880;}return Math.sin(x)/x;}
export const gaussian=(t,s=1)=>Math.exp(-.5*(t/positive(s))**2);
export const gaussianFT=(w,s=1)=>SQRTTAU*positive(s)*Math.exp(-.5*(s*w)**2);
export const rectangle=(t,a=1)=>Math.abs(t)<positive(a)/2?1:Math.abs(t)===a/2?.5:0;
export const rectangleFT=(w,a=1)=>positive(a)*sinc(a*w/2);
export const triangle=(t,a=1)=>Math.max(0,1-Math.abs(t)/positive(a));
export const triangleFT=(w,a=1)=>positive(a)*sinc(a*w/2)**2;
export const bilateralExp=(t,a=1)=>Math.exp(-positive(a)*Math.abs(t));
export const bilateralExpFT=(w,a=1)=>2*positive(a)/(a*a+w*w);
export const cauchy=(t,a=1)=>positive(a)/(Math.PI*(a*a+t*t));
export const cauchyFT=(w,a=1)=>Math.exp(-positive(a)*Math.abs(w));
export function cauchyInverse(t,a,W){positive(a);positive(W);const e=Math.exp(-a*W),A=-Math.expm1(-a*W)+2*e*Math.sin(t*W/2)**2;return{value:(a*A+t*e*Math.sin(t*W))/(Math.PI*(a*a+t*t)),exact:cauchy(t,a),tailBound:e/(Math.PI*a)};}
export function shiftedGaussianFT(w,s,t0,w0=0){return scale(cis(-w*t0),gaussianFT(w-w0,s));}
export const shiftedGaussian=(t,s,t0,w0=0)=>scale(cis(w0*(t-t0)),gaussian(t-t0,s));
export function pulseConvolution(t,a,b,shift=0){positive(a);positive(b);const u=t-shift,lo=Math.max(-a/2,u-b/2),hi=Math.min(a/2,u+b/2);return Math.max(0,hi-lo);}
export const pulseConvolutionFT=(w,a,b,shift=0)=>scale(cis(-w*shift),rectangleFT(w,a)*rectangleFT(w,b));
export function gaussianProduct(s,r,d){positive(s);positive(r);const sum=s*s+r*r,v=s*r/Math.sqrt(sum),center=d*(s*s-r*r)/(2*sum),height=Math.exp(-d*d/(2*sum));return{v,center,height,value:t=>height*gaussian(t-center,v),transform:w=>scale(cis(-w*center),height*gaussianFT(w,v))};}
export function energyWindow(family,width,T,W){positive(width);if(T<0||W<0)throw Error('Nonnegative windows required');if(family==='gaussian'){const E=SQRTPI*width;return{E,time:E*erf(T/width),frequency:E*erf(width*W),timeTail:E*erfc(T/width),frequencyTail:E*erfc(width*W)};}const a=width,E=1/(TAU*a),time=(T/(a*a+T*T)+Math.atan(T/a)/a)/(Math.PI**2),frequency=-Math.expm1(-2*a*W)/(TAU*a);return{E,time,frequency,timeTail:E-time,frequencyTail:E*Math.exp(-2*a*W)};}
export function chirp(t,s,b=0,t0=0,w0=0){positive(s);const u=t-t0;return scale(cis(b*u*u/(4*s*s)+w0*u),Math.exp(-u*u/(4*s*s)));}
export function chirpFT(w,s,b=0,t0=0,w0=0){positive(s);const d=w-w0,D=1+b*b,m=2*SQRTPI*s/D**.25*Math.exp(-s*s*d*d/D),phase=.5*Math.atan(b)-s*s*b*d*d/D-w*t0;return scale(cis(phase),m);}
export function uncertainty(s,b=0){positive(s);return{time:s,frequency:Math.sqrt(1+b*b)/(2*s),product:Math.hypot(1,b)/2,excess:b*b/(2*(Math.hypot(1,b)+1))};}
export function poissonGaussian(s,T,t,N){positive(s);positive(T);if(!Number.isFinite(t)||Math.abs(t)>T/2)throw Error('Poisson tail bound requires |t|≤T/2');if(!Number.isInteger(N)||N<0||N>100)throw Error('Finite nonnegative truncation required');const w=TAU/T,pref=SQRTTAU*s/T;let time=0,freq=0;for(let k=-N;k<=N;k++){time+=gaussian(t-k*T,s);freq+=pref*Math.exp(-.5*(s*k*w)**2)*Math.cos(k*w*t);}const z=(N+.5)*T/(Math.SQRT2*s),a=Math.SQRT2*Math.PI*s/T,q=(N+1)*a,et=Math.exp(-z*z),ct=erfc(z),ef=Math.exp(-q*q),cf=erfc(q),timeBound=2*Math.max(Number.MIN_VALUE,et)+pref*Math.max(Number.MIN_VALUE,ct),frequencyBound=2*pref*Math.max(Number.MIN_VALUE,ef)+Math.max(Number.MIN_VALUE,cf),tailFloor=et===0||ct===0||ef===0||cf===0;return{time,frequency:freq,timeBound,frequencyBound,errorBound:timeBound+frequencyBound,tailFloor};}
export function simpson(f,a,b,N=512){if(!Number.isInteger(N)||N<2||N%2)throw Error('Even Simpson panel count required');const h=(b-a)/N;let sum=f(a)+f(b);for(let j=1;j<N;j++)sum+=(j%2?4:2)*f(a+j*h);return sum*h/3;}
export function truncatedBand(w,B,T,N=512){positive(B);positive(T);return{value:2*simpson(t=>B/Math.PI*sinc(B*t)*Math.cos(w*t),0,T,N),quadratureBound:B*T*(T/N)**4*(B+Math.abs(w))**4/(90*Math.PI)};}
export function outsideWitness(B,T){positive(B);positive(T);const k=Math.ceil(B*T/Math.PI)+1,t=(k+.5)*Math.PI/B;return{t,value:(k%2?-1:1)/(Math.PI*t),k};}
export function phasePacket(t,s,tau,beta,w0){positive(s);const u=t-tau,D=s**4+beta*beta,m=s/D**.25*Math.exp(-u*u*s*s/(2*D)),phase=w0*u-.5*Math.atan2(beta,s*s)+beta*u*u/(2*D);return scale(cis(phase),m);}
export const phaseResponse=(w,tau,beta,w0)=>cis(-tau*w-beta*(w-w0)**2/2);
export function twoPath(w,alpha,tau){const theta=w*tau,h=add([1,0],scale(cis(-theta),alpha)),mag=abs(h),den=(1-alpha)**2+4*alpha*Math.cos(theta/2)**2;return{h,mag,phase:mag>1e-12?Math.atan2(h[1],h[0]):null,delay:den>1e-24?tau*(2*alpha*Math.cos(theta/2)**2+alpha*(alpha-1))/den:null};}
export const gaussianCorrelation=(tau,s,w0=0)=>scale(cis(w0*tau),SQRTPI*positive(s)*Math.exp(-tau*tau/(4*s*s)));
export const gaussianESD=(w,s,w0=0)=>TAU*positive(s)**2*Math.exp(-((s*(w-w0))**2));
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:{l:65,r:28,t:24,b:42},height:310,...extra});
export const format=(v,x,d=6)=>x===0?'0':v.sci(x,d);

// Plain readout text: math.sci returns TeX and must not be inserted without math delimiters.
export const scientific=(x,d=5)=>x===0?'0':x.toExponential(Math.max(0,d-1)).replace(/-/g,'−');
