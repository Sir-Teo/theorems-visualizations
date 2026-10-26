// GAME6 chapter-local rational transcendental enclosures.
// MACRO6 positive-term/geometric-tail method, extended by argument halving and outward interval squaring.
import * as Q from './ch06.exact.shared.js';
export {Q};
const {add,sub,mul,div,neg,sign,approximate:N}=Q;
const sq=x=>mul(x,x),min=(a,b)=>sign(sub(a,b))<=0?Q.exact(a):Q.exact(b),max=(a,b)=>sign(sub(a,b))>=0?Q.exact(a):Q.exact(b);
export const constant=x=>({lo:Q.exact(x),hi:Q.exact(x)});
export const iadd=(a,b)=>({lo:add(a.lo,b.lo),hi:add(a.hi,b.hi)}),ineg=a=>({lo:neg(a.hi),hi:neg(a.lo)}),isub=(a,b)=>iadd(a,ineg(b));
export const imul=(a,b)=>{const xs=[mul(a.lo,b.lo),mul(a.lo,b.hi),mul(a.hi,b.lo),mul(a.hi,b.hi)];return{lo:xs.reduce(min),hi:xs.reduce(max)};};
export const idiv=(a,b)=>{if(sign(b.lo)<=0&&sign(b.hi)>=0)throw Error('interval denominator contains zero');return imul(a,{lo:div(1,b.hi),hi:div(1,b.lo)});};
export const scale=(a,b)=>imul(a,constant(b));
// Outward dyadic rounding limits intermediate integer size while preserving enclosures.
// Relative precision retains a subnormal argument instead of rounding1+x back to1.
function dyadic(x,up,bits){x=Q.exact(x);const s=sign(x);if(!s)return x;if(s<0)return neg(dyadic(neg(x),!up,bits));let e=x.n.toString(2).length-x.d.toString(2).length;if(e>=0?x.n<(x.d<<BigInt(e)):(x.n<<BigInt(-e))<x.d)e--;const shift=bits-1-e,n=shift>=0?x.n<<BigInt(shift):x.n,d=shift>=0?x.d:x.d<<BigInt(-shift);let k=n/d;if(up&&n%d)k++;return shift>=0?Q.rational(k,1n<<BigInt(shift)):Q.rational(k<<BigInt(-shift));}
export const roundI=(a,bits=192)=>({lo:dyadic(a.lo,false,bits),hi:dyadic(a.hi,true,bits)});
function bound(x,a,b,label){if(typeof x!=='number'||!Number.isFinite(x)||x<a||x>b)throw Error(label+' outside declared range');return x;}
const cache=new Map();
function cached(key,make){if(cache.has(key))return cache.get(key);const result=make();if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,result);return result;}
// Positive-term series plus a geometric upper tail, then reciprocal for x<0.
export function expQ(x,bits=160){x=Q.exact(x);return cached('e/'+bits+'/'+Q.exactText(x),()=>{
 if(!sign(x))return constant(1);if(sign(x)<0){const z=expQ(neg(x),bits);return{lo:div(1,z.hi),hi:div(1,z.lo)};}
 if(sign(sub(x,20))>0){const half=expQ(div(x,2),bits+16);return roundI(imul(half,half),bits+16);}
 const tolerance=Q.rational(1n,1n<<BigInt(bits));let total=constant(1),term=constant(1);
 for(let n=1;n<=1000;n++){
  term=roundI(scale(term,div(x,n)),bits+32);total=iadd(total,term);const ratio=div(x,n+2);
  if(sign(sub(ratio,1))>=0)continue;
  const next=div(mul(term.hi,x),n+1),tail=div(next,sub(1,ratio));
  if(sign(sub(tail,mul(tolerance,total.lo)))<=0)return{lo:total.lo,hi:add(total.hi,tail)};
 }
 throw Error('exponential enclosure did not converge');
});}
const expI=x=>{x=roundI(x);return{lo:expQ(x.lo).lo,hi:expQ(x.hi).hi};};
const expm1Q=(x,bits=160)=>isub(expQ(x,bits),constant(1));
function logUnit(x,bits=160){const z=div(sub(x,1),add(x,1));if(!sign(z))return constant(0);const z2=sq(z),tolerance=Q.rational(1n,1n<<BigInt(bits));let power=roundI(constant(z),bits+32),total=power;
 for(let k=0;k<1000;k++){
  const nextPower=roundI(scale(power,z2),bits+32),next=scale(nextPower,div(1,2*k+3)),tail=div(next.hi,sub(1,z2));
  if(sign(sub(tail,mul(tolerance,total.lo)))<=0)return{lo:mul(2,total.lo),hi:mul(2,add(total.hi,tail))};
  power=nextPower;total=iadd(total,next);
 }
 throw Error('logarithm enclosure did not converge');
}
function logQ(x){x=Q.exact(x);if(sign(x)<=0)throw Error('positive logarithm argument required');return cached('l/'+Q.exactText(x),()=>{
 const position=sign(sub(x,1));if(!position)return constant(0);if(position<0)return ineg(logQ(div(1,x)));
 let exponent=x.n.toString(2).length-x.d.toString(2).length;
 if(sign(sub(x,Q.rational(1n<<BigInt(exponent))))<0)exponent--;
 const mantissa=div(x,Q.rational(1n<<BigInt(exponent)));
 return iadd(logUnit(mantissa),scale(logUnit(2),exponent));
});}
export function quantity(x){x=Q.exact(x);const value=N(x),s=sign(x);return{exact:x,value,sign:s,logMagnitude:Q.logAbs(x),belowRange:s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:false};}
export function numerical(interval){if(!sign(sub(interval.hi,interval.lo)))return quantity(interval.lo);const middle=div(add(interval.lo,interval.hi),2),value=N(middle),lo=sign(interval.lo),hi=sign(interval.hi),s=lo>0?1:hi<0?-1:null;return{exact:null,interval,value,sign:s,logMagnitude:Q.logAbs(middle),belowRange:s!==null&&s!==0&&value===0,aboveRange:!Number.isFinite(value),approximate:true};}
const q=quantity,num=numerical;

// Normalize a positive subset against its positive complement, retaining dependence.
export function probability(part,rest){return{lo:div(part.lo,add(part.lo,rest.hi)),hi:div(part.hi,add(part.hi,rest.lo))};}
export const sumIntervals=xs=>xs.reduce(iadd,constant(0));
export const uniquelyRounded=x=>Object.is(N(x.lo),N(x.hi));
export const differenceFrom=(x,y)=>isub(x,constant(y));
