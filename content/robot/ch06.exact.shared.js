// ROBOT6 chapter-local exact binary64 rational arithmetic.
// Rational conversion and integer-midpoint square root retained from verified CTRL6.
const abs=n=>n<0n?-n:n;
const gcd=(a,b)=>{a=abs(a);b=abs(b);while(b){const r=a%b;a=b;b=r;}return a;};
export function rational(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
export const ZERO=rational(0),ONE=rational(1);
export function exact(x){if(typeof x==='object'&&typeof x.n==='bigint')return x;if(!Number.isFinite(x))throw Error('finite coefficient required');if(x===0)return ZERO;const b=new DataView(new ArrayBuffer(8));b.setFloat64(0,x);const hi=b.getUint32(0),lo=b.getUint32(4),e=(hi>>>20)&2047,m=(BigInt(hi&1048575)<<32n)|BigInt(lo),mant=e?m+(1n<<52n):m,power=(e?e-1023:-1022)-52,sign=hi>>>31?-1n:1n;return power>=0?rational(sign*(mant<<BigInt(power))):rational(sign*mant,1n<<BigInt(-power));}
export const add=(a,b)=>{a=exact(a);b=exact(b);const g=gcd(a.d,b.d),ad=a.d/g,bd=b.d/g;return rational(a.n*bd+b.n*ad,ad*b.d);};
export const neg=a=>({n:-exact(a).n,d:exact(a).d});
export const sub=(a,b)=>add(a,neg(b));
// Cancel shared integer factors before forming large products. This keeps
// retained subnormal angle increments practical without rounding or flooring.
export const mul=(a,b)=>{a=exact(a);b=exact(b);const g=gcd(a.n,b.d),h=gcd(b.n,a.d);return rational((a.n/g)*(b.n/h),(a.d/h)*(b.d/g));};
export const div=(a,b)=>{a=exact(a);b=exact(b);if(b.n===0n)throw Error('zero rational denominator');const g=gcd(a.n,b.n),h=gcd(b.d,a.d);return rational((a.n/g)*(b.d/h),(a.d/h)*(b.n/g));};
export const sign=a=>exact(a).n<0n?-1:exact(a).n>0n?1:0;
const logBig=n=>{const s=abs(n).toString(2),k=Math.min(53,s.length);return Math.log(Number(BigInt('0b'+s.slice(0,k))))+(s.length-k)*Math.LN2;};
export const logAbs=a=>{a=exact(a);return a.n===0n?-Infinity:logBig(a.n)-logBig(a.d);};
export function approximate(a){a=exact(a);if(!a.n)return 0;const n=abs(a.n),d=a.d;let exponent=n.toString(2).length-d.toString(2).length;if(exponent>=0?n<(d<<BigInt(exponent)):(n<<BigInt(-exponent))<d)exponent--;const shift=exponent< -1022?1074:52-exponent,N=shift>=0?n<<BigInt(shift):n,D=shift>=0?d:d<<BigInt(-shift);let q=N/D;const remainder=N%D;if(2n*remainder>D||(2n*remainder===D&&q%2n===1n))q++;if(exponent< -1022)return sign(a)*Number(q)*Number.MIN_VALUE;if(q===(1n<<53n)){q>>=1n;exponent++;}return exponent>1023?sign(a)*Infinity:sign(a)*Number(q)*2**(exponent-52);}
// Correctly rounded sqrt(n/d), without underflowing the squared magnitude.
// Midpoint comparison is exact: 4N ? D(2q+1)^2, with ties to even.
function integerSquareRoot(n){if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));for(;;){const y=(x+n/x)>>1n;if(y>=x)return x;x=y;}}
export function squareRoot(a){a=exact(a);if(a.n<0n)throw Error('nonnegative rational square root required');if(!a.n)return 0;const n=a.n,d=a.d;let exponent=n.toString(2).length-d.toString(2).length;if(exponent>=0?n<(d<<BigInt(exponent)):(n<<BigInt(-exponent))<d)exponent--;exponent=Math.floor(exponent/2);const shift=exponent< -1022?1074:52-exponent,N=shift>=0?n<<BigInt(2*shift):n,D=shift>=0?d:d<<BigInt(-2*shift);let q=integerSquareRoot(N/D);const midpoint=D*(2n*q+1n)**2n;if(4n*N>midpoint||(4n*N===midpoint&&q%2n===1n))q++;if(exponent< -1022)return Number(q)*Number.MIN_VALUE;if(q===(1n<<53n)){q>>=1n;exponent++;}return exponent>1023?Infinity:Number(q)*2**(exponent-52);}

export const exactText=a=>{a=exact(a);return a.d===1n?String(a.n):a.n+'/'+a.d;};
