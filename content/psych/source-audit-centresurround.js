import { erfc } from '../../assets/js/viz/math.js';
const SQRT2PI=Math.sqrt(2*Math.PI);
function range(x,a,b,name){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw new RangeError(name);}
export const gaussianMass=(r,s)=>-Math.expm1(-r*r/(2*s*s));
export function centreSurround(radius=1,ratio=3,k=.9,shape='spot',on=true){
  range(radius,0,6,'radius');range(ratio,1.5,5,'surround ratio');range(k,0,1.2,'surround strength');
  if(typeof shape!=='string'||!['spot','ring','full'].includes(shape)||typeof on!=='boolean')throw new RangeError('declared stimulus and polarity');
  const sc=.8,ss=sc*ratio,sign=on?1:-1,disk=r=>gaussianMass(r,sc)-k*gaussianMass(r,ss),drive=shape==='full'?1-k:shape==='spot'?disk(radius):disk(radius+1.5)-disk(radius),rate=d=>Math.max(0,20+60*sign*d);
  const critical=k===0?null:Math.sqrt(2*(Math.log(ratio*ratio)-Math.log(k))/(1/(sc*sc)-1/(ss*ss)));
  const candidates=[0,6,...(critical!==null&&critical>0&&critical<6?[critical]:[])].map(r=>({r,drive:disk(r),rate:rate(disk(r))}));
  const bestValue=Math.max(...candidates.map(p=>p.rate)),best=candidates.filter(p=>p.rate===bestValue),xs=[...new Set([...Array.from({length:241},(_,i)=>i/40),radius,...candidates.map(p=>p.r)])].sort((a,b)=>a-b);
  return {radius,ratio,k,shape,on,sc,ss,sign,drive,rate:rate(drive),uniformDrive:1-k,uniformRate:rate(1-k),critical,candidates,best,curve:xs.map(r=>[r,rate(disk(r))]),probeDisk:rate(disk(radius))};
}
export function fieldWeight(x,y,sc,ss,k){const r2=x*x+y*y;return Math.exp(-r2/(2*sc*sc))/(2*Math.PI*sc*sc)-k*Math.exp(-r2/(2*ss*ss))/(2*Math.PI*ss*ss);}
export const normalCDF=x=>.5*erfc(-x/Math.SQRT2);
const phi=x=>Math.exp(-x*x/2)/SQRT2PI;
// A positive hinge's Gaussian mean. Symmetry avoids subtracting its large linear part.
function hinge(z,s){if(z>0)return z+hinge(-z,s);const u=z/s;return Math.max(0,z*normalCDF(u)+s*phi(u));}
const GLX=[-.9602898564975363,-.7966664774136267,-.525532409916329,-.1834346424956498,.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363];
const GLW=[.1012285362903763,.2223810344533745,.3137066458778873,.362683783378362,.362683783378362,.3137066458778873,.2223810344533745,.1012285362903763];
// Exact convolution formula, with positive 8-point Gaussian quadrature only when
// the tiny ramp interval would cause cancellation. This has O((width/s)^16) error.
export function blurredRamp(x,centre,width,s){
  const z=x-centre;if(width===0)return .25+.55*normalCDF(z/s);
  let f;if(width<1e-4*s)f=GLX.reduce((q,t,i)=>q+GLW[i]*normalCDF((z-t*width/2)/s)/2,0);
  else f=(hinge(z+width/2,s)-hinge(z-width/2,s))/width;
  return .25+.55*Math.min(1,Math.max(0,f)); // at most floating-point endpoint roundoff
}
function blurredSlope(x,centre,width,s){const z=x-centre;if(width===0)return .55*phi(z/s)/s;
  if(width<1e-4*s)return .55*GLX.reduce((q,t,i)=>q+GLW[i]*phi((z-t*width/2)/s)/(2*s),0);
  return .55*(normalCDF((z+width/2)/s)-normalCDF((z-width/2)/s))/width;
}
// Keep the input itself centered too: rounded absolute knees lose a tiny width.
export function rampInput(x,centre,width){
  if(width===0)return x<centre?.25:x>centre?.8:.525;
  return .25+.55*Math.min(1,Math.max(0,.5+(x-centre)/width));
}
export function machFilter(sc=.12,ratio=4,k=1,centre=5,width=1.2,probe=5){
  range(sc,.04,.4,'centre width');range(ratio,2,8,'surround ratio');range(k,0,1.2,'surround strength');range(centre,3.5,6.5,'ramp centre');range(width,0,7,'ramp width');range(probe,-3,13,'probe');
  const ss=sc*ratio,a=centre-width/2,b=centre+width/2,lum=x=>rampInput(x,centre,width),response=x=>blurredRamp(x,centre,width,sc)-k*blurredRamp(x,centre,width,ss),slope=x=>blurredSlope(x,centre,width,sc)-k*blurredSlope(x,centre,width,ss),xs=[...new Set([...Array.from({length:801},(_,i)=>-3+i/50),a,b,centre,probe])].sort((a,b)=>a-b);
  // At either knee use survival tails, avoiding subtraction of two nearly equal half-probabilities.
  const kneeSlope=width>1e-4*sc?.55/width*((1-k)/2+k*normalCDF(-width/ss)-normalCDF(-width/sc)):slope(a);
  const v=Math.sqrt(2*Math.log(ratio)/(1-1/(ratio*ratio))),stepEnvelope=.55*(normalCDF(v)-normalCDF(v/ratio)),base=[(1-k)*.25,(1-k)*.8],responseBounds=[Math.max(.25-k*.8,Math.min(...base)-stepEnvelope),Math.min(.8-k*.25,Math.max(...base)+stepEnvelope)];
  const stimulus=width===0?[[-3,.25],[centre,.25],[centre,.8],[13,.8]]:[[-3,.25],[a,.25],[b,.8],[13,.8]];
  return {sc,ss,ratio,k,centre,width,probe,a,b,stepEnvelope,responseBounds,stimulus,response:xs.map(x=>[x,response(x)]),lowLimit:(1-k)*.25,highLimit:(1-k)*.8,atProbe:response(probe),atA:response(a),atB:response(b),slopeA:kneeSlope,slopeB:kneeSlope,kneeUnderflow:k===1&&width>0&&kneeSlope===0,lumProbe:lum(probe)};
}
