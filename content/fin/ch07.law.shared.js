// Constructed law for the FIN7 proof illustrations, never market calibration.
// All kinks, interval masses and option values use the original binary64 rationals.
import * as Q from './ch07.exact.shared.js';
export {Q};
const {add,sub,mul,div,sign}=Q;
const min=(a,b)=>sign(sub(a,b))<=0?Q.exact(a):Q.exact(b);
const max=(a,b)=>sign(sub(a,b))>=0?Q.exact(a):Q.exact(b);
const square=x=>mul(x,x),cube=x=>mul(square(x),x);
const bound=(x,a,b,label)=>{if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside declared range');};
export function quantity(x){x=Q.exact(x);const value=Q.approximate(x),s=sign(x);return{exact:x,value,sign:s,logMagnitude:Q.logAbs(x),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:false};}
// Domain a=40 < c < b=160; all chosen laws have positive support.
export function law(mode=100){
 bound(mode,45,155,'triangular mode');
 const a=Q.exact(40),b=Q.exact(160),c=Q.exact(mode),span=sub(b,a),left=mul(span,sub(c,a)),right=mul(span,sub(b,c)),mean=div(add(add(a,b),c),3);
 function cdf(x){
  x=Q.exact(x);
  if(sign(sub(x,a))<=0)return Q.ZERO;
  if(sign(sub(x,b))>=0)return Q.ONE;
  return sign(sub(x,c))<=0?div(square(sub(x,a)),left):sub(1,div(square(sub(b,x)),right));
 }
 function density(x){
  x=Q.exact(x);
  if(sign(sub(x,a))<=0||sign(sub(x,b))>=0)return Q.ZERO;
  return sign(sub(x,c))<=0?div(mul(2,sub(x,a)),left):div(mul(2,sub(b,x)),right);
 }
 function call(x){
  x=Q.exact(x);
  if(sign(sub(x,a))<=0)return sub(mean,x);
  if(sign(sub(x,b))>=0)return Q.ZERO;
  return sign(sub(x,c))>=0?div(cube(sub(b,x)),mul(3,right)):add(sub(mean,x),div(cube(sub(x,a)),mul(3,left)));
 }
 const put=x=>add(call(x),sub(x,mean));
 return{a,b,c,mean,cdf,density,call,put};
}
export function densityRecovery({mode=100,strike=100,discount=.95,bandwidth=5}={}){
 bound(strike,0,240,'strike');bound(discount,.25,1.5,'discount factor');bound(bandwidth,0,30,'symmetric bandwidth');
 const L=law(mode),K=Q.exact(strike),h=Q.exact(bandwidth),center=L.call(K),left=L.call(sub(K,h)),right=L.call(add(K,h)),second=sub(add(left,right),mul(2,center)),recovery=bandwidth===0?null:div(second,square(h));
 const physical={mean:L.mean,stockPrice:mul(discount,L.mean),callPrice:mul(discount,center),putPrice:mul(discount,L.put(K)),callSlope:mul(discount,sub(L.cdf(K),1)),callCurvature:mul(discount,L.density(K)),cdf:L.cdf(K),survival:sub(1,L.cdf(K)),density:L.density(K),probabilityMass:1,butterflyCost:mul(discount,second),discountedBandwidthSquare:mul(discount,square(h)),parityResidual:sub(sub(center,L.put(K)),sub(L.mean,K))};
 return{parameters:{mode,strike,discount,bandwidth},...Object.fromEntries(Object.entries(physical).map(([k,v])=>[k,quantity(v)])),recoveredDensity:recovery===null?null:quantity(recovery),recoveryError:recovery===null?null:quantity(sub(recovery,L.density(K))),bandwidthMeaning:bandwidth===0?'finite-difference diagnostic undefined at zero bandwidth':'triangular-kernel average of the density over the actual finite window'};
}
export function claims({mode=100,physicalMode=80,face=100,discount=.95,terminalAssets=100}={}){
 bound(face,0,240,'promised debt');bound(discount,.25,1.5,'discount factor');bound(terminalAssets,0,240,'terminal assets');
 const L=law(mode),P=law(physicalMode),F=Q.exact(face),V=Q.exact(terminalAssets),equity=max(sub(V,F),0),debt=min(V,F),loss=max(sub(F,V),0),put=L.put(F),call=L.call(F),debtValue=mul(discount,sub(F,put)),equityValue=mul(discount,call),assetValue=mul(discount,L.mean);
 const physical={equityPayoff:equity,debtPayoff:debt,defaultLoss:loss,payoffResidual:sub(add(equity,debt),V),promiseDecompositionResidual:sub(add(debt,loss),F),equityValue,debtValue,assetValue,valueResidual:sub(add(equityValue,debtValue),assetValue),riskNeutralDefault:L.cdf(F),physicalDefault:P.cdf(F),putValue:mul(discount,put)};
 return{parameters:{mode,physicalMode,face,discount,terminalAssets},...Object.fromEntries(Object.entries(physical).map(([k,v])=>[k,quantity(v)])),scope:'Constructed terminal law, same state-price density for every claim. No fitted Merton dynamics, market-implied default frequency or percentage return for a zero-price claim.'};
}
