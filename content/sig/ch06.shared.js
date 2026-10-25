// Own chapter-local models. Engineering FT uses exp(-i*w*t), inverse 1/(2*pi).
export const TAU = 2 * Math.PI;
export function finite(x, name='value') {
  if (typeof x !== 'number' || !Number.isFinite(x)) throw new RangeError(name+' must be finite');
  return x;
}
export function bound(x, lo, hi, name='value') {
  finite(x,name); if(x<lo || x>hi) throw new RangeError(name+' outside supported domain'); return x;
}
export function choice(x, options) { if(!options.includes(x)) throw new RangeError('Unsupported mode'); return x; }
export const mul = (a,b) => [a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
export const cis = x => [Math.cos(x),Math.sin(x)];
export const magnitude = z => Math.hypot(...z);
export function sinc(x) {
  if(Math.abs(x)<.01) { const q=x*x; return 1+q*(-1/6+q*(1/120+q*(-1/5040+q/362880))); }
  return Math.sin(x)/x;
}
// Fixed 16-point Gauss-Legendre rule, applied in panels of length <= pi/2.
const GX=[.09501250983763744,.2816035507792589,.4580167776572274,.6178762444026438,.755404408355003,.8656312023878318,.9445750230732326,.9894009349916499];
const GW=[.1894506104550685,.1826034150449236,.16915651939500254,.14959598881657673,.12462897125553387,.09515851168249278,.06225352393864789,.027152459411754095];
export function gauss(f,a,b,panels=1) {
  let total=0; const h=(b-a)/panels;
  for(let j=0;j<panels;j++) { const m=a+(j+.5)*h,r=h/2; let sum=0;
    for(let k=0;k<8;k++)sum+=GW[k]*(f(m-r*GX[k])+f(m+r*GX[k]));
    total+=r*sum;
  } return total;
}
export const si = x => gauss(sinc,0,x,Math.max(1,Math.ceil(Math.abs(x)/(Math.PI/2))));
export function positiveMetric(log, zero=false) {
  if(zero)return {value:0,log:null,status:'zero'};
  const value=Math.exp(log);return {value,log,status:value===0?'positive below binary64 range':value<2.2250738585072014e-308?'positive subnormal':'positive'};
}
export function firstResponse(w,tau=1) {
  bound(tau,.05,5,'time constant');finite(w);const u=w*tau,d=1+u*u;
  return {h:[1/d,-u/d],gain:1/Math.hypot(1,u),phase:-Math.atan(u),delay:tau/d,phaseUnderflow:w!==0&&u===0,phaseLog:w===0?null:Math.log(Math.abs(w))+Math.log(tau)};
}
export function firstStep(t,tau=1) { bound(tau,.05,5);finite(t);return t<0?0:-Math.expm1(-t/tau); }
export function firstModel(tau=1) {
  bound(tau,.05,5);return {tau,angularBandwidth:1/tau,hertzBandwidth:1/(TAU*tau),t10:-tau*Math.log(.9),t90:tau*Math.LN10,rise:tau*Math.log(9),product:Math.log(9)/TAU};
}
export const HARMONICS=[{w:1,a:1,p:0},{w:2,a:.7,p:.4},{w:3,a:.5,p:-.7},{w:5,a:.35,p:1.1},{w:7,a:.2,p:-.3}];
export function idealGain(w,mode='low-pass',cutoff=3,width=2) {
  choice(mode,['low-pass','high-pass','band-pass']);finite(w);bound(cutoff,.5,7);bound(width,.5,4);const a=Math.abs(w);
  // Isolated edge values are explicitly assigned to the pass band in this finite harmonic illustration.
  return mode==='low-pass'?(a<=cutoff?1:0):mode==='high-pass'?(a>cutoff?1:0):(a>=cutoff&&a<=cutoff+width?1:0);
}
export function harmonicSignal(t,{mode='low-pass',cutoff=3,width=2,filtered=false,delay=0,curvature=0,gain=1}={}) {
  finite(t);bound(delay,0,3);bound(curvature,0,.06);bound(gain,.2,2);return HARMONICS.reduce((sum,{w,a,p})=>sum+a*(filtered?idealGain(w,mode,cutoff,width):1)*gain*Math.cos(w*(t-delay)+p-curvature*w*w*w/3),0);
}
export function idealImpulse(t,W=2,delay=0) {bound(W,.5,5);finite(t);finite(delay);return W/Math.PI*sinc(W*(t-delay));}
export function causalTruncation(t,{W=2,delay=2}={}) {bound(delay,.5,8);bound(W,.5,5);finite(t);return t<0||t>2*delay?0:idealImpulse(t,W,delay);}
export function truncatedResponse(w,{W=2,delay=2}={}) {
  bound(W,.5,5);bound(delay,.5,8);finite(w);const signedGain=(si((W+w)*delay)+si((W-w)*delay))/Math.PI;
  return {signedGain,gain:Math.abs(signedGain),h:cis(-w*delay).map(x=>x*signedGain)};
}
export function negativeTimeWitness(W=2,delay=2) {
  bound(W,.5,5);bound(delay,.5,8);const k=Math.floor(W*delay/Math.PI)+1,u=-(k+.5)*Math.PI/W;
  return {t:delay+u,value:(k%2? -1:1)/(-Math.PI*u),k};
}
export function paleyModel({family='power law',alpha=1,a=.5,cutoff=2,R=10}={}) {
  choice(family,['power law','Gaussian','brick wall']);bound(alpha,.6,3);bound(a,.05,2);bound(cutoff,.5,5);bound(R,.1,50);
  const logMagnitude=w=>family==='power law'?-.5*alpha*Math.log1p(w*w):family==='Gaussian'?-a*w*w:Math.abs(w)<=cutoff?0:-Infinity;
  const finiteIntegral=r=>family==='power law'?-2*alpha*gauss(t=>Math.log(Math.cos(t)),0,Math.atan(r),16):family==='Gaussian'?2*a*(r-Math.atan(r)):r>cutoff?Infinity:0;
  return {logMagnitude,finiteIntegral,value:finiteIntegral(R),limit:family==='power law'?alpha*Math.PI*Math.LN2:Infinity,admissible:family==='power law',criterion:'existence of some causal L2 phase; not a BIBO claim'};
}
export function phasePacket(t,{sigma=1,beta=2,delay=2,carrier=3}={}) {
  bound(sigma,.3,3);bound(beta,-6,6);bound(delay,0,5);bound(carrier,1,8);finite(t);
  const u=t-delay,D=sigma**4+beta*beta,envelope=sigma/D**.25*Math.exp(-u*u*sigma*sigma/(2*D)),phase=carrier*u-.5*Math.atan2(beta,sigma*sigma)+beta*u*u/(2*D);
  return {z:cis(phase).map(x=>x*envelope),envelope,width:Math.hypot(sigma*sigma,beta)/sigma,extraVariance:positiveMetric(2*Math.log(Math.abs(beta))-Math.log(2)-2*Math.log(sigma),beta===0)};
}
export function bode(w,{pole=1,zero=2,gainDB=0,withZero=true}={}) {
  bound(pole,.2,5);bound(zero,.2,5);bound(gainDB,-12,12);if(typeof withZero!=='boolean')throw new RangeError('Boolean zero control required');bound(w,.001,1000);
  const p=w/pole,z=w/zero,dB=gainDB-10*Math.log1p(p*p)/Math.LN10+(withZero?10*Math.log1p(z*z)/Math.LN10:0),phase=withZero?Math.atan2(w*(pole-zero),pole*zero+w*w):-Math.atan(p),asymptote=gainDB-20*Math.max(0,Math.log10(p))+(withZero?20*Math.max(0,Math.log10(z)):0),ramp=x=>Math.max(0,Math.min(2,Math.log10(x)+1))*Math.PI/4;
  return {dB,phase,asymptote,phaseApproximation:-ramp(p)+(withZero?ramp(z):0)};
}
export function secondResponse(w,{zeta=.4,omega=2}={}) {
  bound(zeta,.05,2);bound(omega,.5,5);finite(w);const u=w/omega,re=1-u*u,im=2*zeta*u,d=re*re+im*im;
  return {h:[re/d,-im/d],gain:1/Math.hypot(re,im),phase:-Math.atan2(im,re)};
}
export function secondStep(t,{zeta=.4,omega=2}={}) {
  bound(zeta,.05,2);bound(omega,.5,5);finite(t);if(t<=0)return 0;const u=omega*t;
  if(u<.25) {let am=0,a=0,pow=u*u,sum=0;for(let n=0;n<26;n++){const next=((n===0?1:0)-2*zeta*(n+1)*a-am)/((n+2)*(n+1));sum+=next*pow;pow*=u;am=a;a=next;}return sum;}
  if(zeta<1){const d=Math.sqrt((1-zeta)*(1+zeta));return 1-Math.exp(-zeta*u)*(Math.cos(d*u)+zeta*u*sinc(d*u));}
  if(zeta===1)return -Math.expm1(-u)-u*Math.exp(-u);
  const d=Math.sqrt((zeta-1)*(zeta+1)),q=d*u,slow=Math.exp(-u/(zeta+d)),fast=Math.exp(-(zeta+d)*u),sinhTerm=q===0?Math.exp(-zeta*u):slow*(-Math.expm1(-2*q))/(2*q);
  return 1-(slow+fast)/2-zeta*u*sinhTerm;
}
export function secondImpulse(t,{zeta=.4,omega=2}={}) {
  bound(zeta,.05,2);bound(omega,.5,5);finite(t);if(t<0)return 0;const u=omega*t;
  if(zeta<=1){const d=Math.sqrt((1-zeta)*(1+zeta));return omega*u*Math.exp(-zeta*u)*sinc(d*u);}
  const d=Math.sqrt((zeta-1)*(zeta+1)),q=d*u;
  return omega*u*Math.exp(-u/(zeta+d))*(q===0?1:-Math.expm1(-2*q)/(2*q));
}
export function secondModel({zeta=.4,omega=2}={}) {
  bound(zeta,.05,2);bound(omega,.5,5);const square=zeta*zeta,split=134217729*zeta,hi=split-(split-zeta),lo=zeta-hi,squareError=((hi*hi-square)+2*hi*lo)+lo*lo,resonanceSquared=(1-2*square)-2*squareError,resonant=resonanceSquared>0,underdamped=zeta<1;
  return {resonant,underdamped,peakFrequency:resonant?omega*Math.sqrt(resonanceSquared):0,peakGain:resonant?1/(2*zeta*Math.sqrt(1-zeta*zeta)):1,overshoot:positiveMetric(underdamped?-Math.PI*zeta/Math.sqrt((1-zeta)*(1+zeta)):0,!underdamped),timeSpan:8/(omega*(zeta<=1?zeta:1/(zeta+Math.sqrt((zeta-1)*(zeta+1)))))};
}
export function minimumPhase(w,{pole=1,zero=2,reflected=false,delay=0}={}) {
  bound(pole,.2,5);bound(zero,.2,5);bound(delay,0,2);if(typeof reflected!=='boolean')throw new RangeError('Boolean reflection required');finite(w);
  const p=w/pole,z=w/zero,h=mul([1,reflected?-z:z],[1/(1+p*p),-p/(1+p*p)]),phase=(reflected?-Math.atan(z)-Math.atan(p):Math.atan2(w*(pole-zero),pole*zero+w*w))-w*delay;
  return {h:mul(h,cis(-w*delay)),gain:Math.hypot(1,z)/Math.hypot(1,p),phase,groupDelay:reflected?pole/(pole*pole+w*w)+zero/(zero*zero+w*w)+delay:(pole-zero)*(w*w-pole*zero)/((pole*pole+w*w)*(zero*zero+w*w))+delay};
}
export function minimumStep(t,{pole=1,zero=2,reflected=false}={}) {
  bound(pole,.2,5);bound(zero,.2,5);if(typeof reflected!=='boolean')throw new RangeError('Boolean reflection required');finite(t);if(t<0)return 0;
  return -Math.expm1(-pole*t)+(reflected?-1:1)*pole/zero*Math.exp(-pole*t);
}
export function gainPhase(w,{pole=1,zero=2,panels=12}={}) {
  bound(pole,.2,5);bound(zero,.2,5);bound(w,.1,10);if(!Number.isInteger(panels)||panels<1||panels>64)throw new RangeError('Integer quadrature panels required');
  const delta=(pole-zero)*(pole+zero),L=x=>.5*Math.log1p(x*x*delta/(zero*zero*(pole*pole+x*x))),Lw=L(w),atInfinity=.5*Math.log1p(delta/(zero*zero+w*w));
  const integrand=t=>{if(t===Math.PI/2)return atInfinity;const x=Math.tan(t),D=(x-w)*(x+w),factor=delta/((zero*zero+w*w)*(pole*pole+x*x));if(D===0)return .5*factor*(1+x*x);return .5*Math.log1p(D*factor)/D*(1+x*x);};
  const split=Math.atan(w),integral=gauss(integrand,0,split,panels)+gauss(integrand,split,Math.PI/2,panels),phase=2*w/Math.PI*integral;
  return {phase,exact:Math.atan2(w*(pole-zero),pole*zero+w*w),integrand,logMagnitude:L};
}
export function cascadeStep(u) {if(u<=0)return 0;if(u<.05){let sum=0,p=u*u,f=2;for(let n=2;n<20;n++){if(n>2){p*=u;f*=n;}sum+=(n%2===0?1:-1)*(n-1)*p/f;}return sum;}return -Math.expm1(-u)-u*Math.exp(-u);}
export function allpassLowStep(t,b=1,ratio=1) {
  bound(b,.2,5);bound(ratio,.05,5);finite(t);if(t<0)return 0;const a=ratio*b,u=b*t,d=Math.abs(a-b)*t,decay=Math.exp(-Math.min(a,b)*t),rel=d===0?1:-Math.expm1(-d)/d;
  return -Math.expm1(-u)-2*u*decay*rel;
}
export function crossing(fn,level) {
  let hi=1;while(fn(hi)<level){hi*=2;if(hi>1e6)throw new RangeError('Crossing not bracketed');}let lo=0;
  for(let j=0;j<80;j++){const mid=(lo+hi)/2;if(fn(mid)<level)lo=mid;else hi=mid;}return (lo+hi)/2;
}
export function riseModel({family='one pole',bandwidth=1,ratio=1}={}) {
  choice(family,['one pole','two poles','one pole plus all-pass']);bound(bandwidth,.2,5);bound(ratio,.05,5);
  const c=Math.sqrt(Math.SQRT2-1),step=t=>family==='one pole'?(t<0?0:-Math.expm1(-bandwidth*t)):family==='two poles'?cascadeStep(bandwidth*t/c):allpassLowStep(t,bandwidth,ratio),t10=crossing(step,.1),t90=crossing(step,.9),frequency=w=>family==='two poles'?1/(1+(w*c/bandwidth)**2):1/Math.hypot(1,w/bandwidth);
  return {step,frequency,t10,t90,rise:t90-t10,product:(t90-t10)*bandwidth/TAU,hertzBandwidth:bandwidth/TAU};
}
export function taperImpulse(t,{W=2,taper=.5}={}) {bound(W,.5,5);bound(taper,0,1);finite(t);return W/Math.PI*sinc(W*t)*sinc(taper*W*t);}
export function taperGain(w,{W=2,taper=.5}={}) {
  bound(W,.5,5);bound(taper,0,1);finite(w);const q=Math.abs(w)/W;if(taper===0)return q<=1?1:0;
  const d=(Math.abs(w)-W)/W;return d<=-taper?1:d>=taper?0:.5-.5*d/taper;
}
export function taperStep(t,{W=2,taper=.5}={}) {bound(W,.5,5);bound(taper,0,1);finite(t);const x=W*t;return .5+gauss(u=>sinc(u)*sinc(taper*u),0,x,Math.max(1,Math.ceil(Math.abs(x)/(Math.PI/2))))/Math.PI;}
