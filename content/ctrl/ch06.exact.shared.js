// Chapter-local exact binary64 rationals and formal-epsilon Routh arithmetic.
// Coefficients are ascending. No shared math or renderer modifications.
const abs=n=>n<0n?-n:n;
const gcd=(a,b)=>{a=abs(a);b=abs(b);while(b){const r=a%b;a=b;b=r;}return a;};
export function rational(n,d=1n){n=BigInt(n);d=BigInt(d);if(!d)throw Error('zero rational denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return{n:n/g,d:d/g};}
export const ZERO=rational(0),ONE=rational(1);
export function exact(x){if(typeof x==='object'&&typeof x.n==='bigint')return x;if(!Number.isFinite(x))throw Error('finite coefficient required');if(x===0)return ZERO;const b=new DataView(new ArrayBuffer(8));b.setFloat64(0,x);const hi=b.getUint32(0),lo=b.getUint32(4),e=(hi>>>20)&2047,m=(BigInt(hi&1048575)<<32n)|BigInt(lo),mant=e?m+(1n<<52n):m,power=(e?e-1023:-1022)-52,sign=hi>>>31?-1n:1n;return power>=0?rational(sign*(mant<<BigInt(power))):rational(sign*mant,1n<<BigInt(-power));}
export const add=(a,b)=>{a=exact(a);b=exact(b);return rational(a.n*b.d+b.n*a.d,a.d*b.d);};
export const neg=a=>({n:-exact(a).n,d:exact(a).d});
export const sub=(a,b)=>add(a,neg(b));
export const mul=(a,b)=>{a=exact(a);b=exact(b);return rational(a.n*b.n,a.d*b.d);};
export const div=(a,b)=>{a=exact(a);b=exact(b);return rational(a.n*b.d,a.d*b.n);};
export const sign=a=>exact(a).n<0n?-1:exact(a).n>0n?1:0;
const logBig=n=>{const s=abs(n).toString(2),k=Math.min(53,s.length);return Math.log(Number(BigInt('0b'+s.slice(0,k))))+(s.length-k)*Math.LN2;};
export const logAbs=a=>{a=exact(a);return a.n===0n?-Infinity:logBig(a.n)-logBig(a.d);};
export function approximate(a){a=exact(a);if(!a.n)return 0;const n=abs(a.n),d=a.d;let exponent=n.toString(2).length-d.toString(2).length;if(exponent>=0?n<(d<<BigInt(exponent)):(n<<BigInt(-exponent))<d)exponent--;const shift=exponent< -1022?1074:52-exponent,N=shift>=0?n<<BigInt(shift):n,D=shift>=0?d:d<<BigInt(-shift);let q=N/D;const remainder=N%D;if(2n*remainder>D||(2n*remainder===D&&q%2n===1n))q++;if(exponent< -1022)return sign(a)*Number(q)*Number.MIN_VALUE;if(q===(1n<<53n)){q>>=1n;exponent++;}return exponent>1023?sign(a)*Infinity:sign(a)*Number(q)*2**(exponent-52);}
export const exactText=a=>{a=exact(a);return a.d===1n?String(a.n):a.n+'/'+a.d;};
export function poly(a){const p=a.map(exact);while(p.length>1&&!sign(p.at(-1)))p.pop();return p.length?p:[ZERO];}
export const degree=a=>poly(a).length-1;
export const isZero=a=>poly(a).length===1&&!sign(poly(a)[0]);
export function pAdd(a,b){const r=[];for(let i=0;i<Math.max(a.length,b.length);i++)r.push(add(a[i]??ZERO,b[i]??ZERO));return poly(r);}
export const pNeg=a=>a.map(neg),pSub=(a,b)=>pAdd(a,pNeg(b));
export function pMul(a,b){const r=Array(a.length+b.length-1).fill(ZERO);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)r[i+j]=add(r[i+j],mul(a[i],b[j]));return poly(r);}
export const pScale=(a,b)=>poly(a.map(x=>mul(x,b)));
export const derivative=a=>poly(a.slice(1).map((x,i)=>mul(x,i+1)));
export function pDiv(a,b){a=poly(a);b=poly(b);if(isZero(b))throw Error('polynomial division by zero');const q=Array(Math.max(1,a.length-b.length+1)).fill(ZERO),r=a.slice();for(let i=a.length-b.length;i>=0;i--){const x=div(r[b.length-1+i],b.at(-1));q[i]=x;for(let j=0;j<b.length;j++)r[j+i]=sub(r[j+i],mul(x,b[j]));}return{q:poly(q),r:poly(r)};}
export const monic=a=>pScale(poly(a),div(ONE,poly(a).at(-1)));
export function pGcd(a,b){a=poly(a);b=poly(b);while(!isZero(b)){const r=pDiv(a,b).r;a=b;b=r;}return monic(a);}
export function squareFree(a){a=monic(a);if(degree(a)===0)return[];let g=pGcd(a,derivative(a)),w=pDiv(a,g).q,i=1;const out=[];while(degree(w)>0){const y=pGcd(w,g),f=pDiv(w,y).q;if(degree(f)>0)out.push({coefficients:monic(f),multiplicity:i});w=y;g=pDiv(g,y).q;i++;if(i>degree(a)+1)throw Error('square-free decomposition failed');}return out;}
// Rational functions in a formal epsilon>0; cancel exact polynomial factors.
function rf(n,d=[ONE]){n=poly(n);d=poly(d);if(isZero(n))return{n:[ZERO],d:[ONE]};if(isZero(d))throw Error('zero rational function denominator');if(degree(n)||degree(d)){const g=pGcd(n,d);if(degree(g)){n=pDiv(n,g).q;d=pDiv(d,g).q;}}const scale=div(ONE,d.at(-1));return{n:pScale(n,scale),d:pScale(d,scale)};}
const constant=a=>rf([exact(a)]),epsilon=()=>rf([ZERO,ONE]),rZero=a=>isZero(a.n);
const rSub=(a,b)=>rf(pSub(pMul(a.n,b.d),pMul(b.n,a.d)),pMul(a.d,b.d));
const rMul=(a,b)=>rf(pMul(a.n,b.n),pMul(a.d,b.d)),rDiv=(a,b)=>rf(pMul(a.n,b.d),pMul(a.d,b.n));
const firstNonzero=p=>p.findIndex(x=>sign(x));
export function epsilonTerm(a){const i=firstNonzero(a.n);if(i<0)return{sign:0,power:0,coefficient:ZERO,value:0};const j=firstNonzero(a.d),coefficient=div(a.n[i],a.d[j]),power=i-j;return{sign:sign(coefficient),power,coefficient,value:power>0?0:power<0?sign(coefficient)*Infinity:approximate(coefficient)};}
function countSide(coefficients,keepRows=false){const c=poly(coefficients),n=degree(c),cols=Math.ceil((n+1)/2),z=constant(0),rows=[Array.from({length:cols},(_,j)=>constant(c[n-2*j]??0))],events=[];if(n)rows.push(Array.from({length:cols},(_,j)=>constant(c[n-1-2*j]??0)));
 for(let i=1;i<=n;i++){
  if(rows[i].every(rZero)){const power=n-i+1;rows[i]=rows[i-1].map((x,j)=>rMul(x,constant(Math.max(0,power-2*j))));events.push({row:i,kind:'whole zero row',auxiliaryDegree:power,auxiliary:keepRows?rows[i-1]:undefined});}
  if(rZero(rows[i][0])){rows[i][0]=epsilon();events.push({row:i,kind:'zero leading entry',replacement:'formal epsilon>0'});}
  if(i<n)rows.push(Array.from({length:cols},(_,j)=>rDiv(rSub(rMul(rows[i][0],rows[i-1][j+1]??z),rMul(rows[i-1][0],rows[i][j+1]??z)),rows[i][0])));
 }
 const signs=rows.map(r=>epsilonTerm(r[0]).sign);let changes=0;for(let i=1;i<signs.length;i++)if(signs[i]!==signs[i-1])changes++;return{count:changes,signs,events,rows:keepRows?rows:undefined};}
export function routh(coefficients){let c=poly(coefficients);if(isZero(c))throw Error('zero polynomial has no finite root count');const originalDegree=degree(c);let origins=0;while(c.length>1&&!sign(c[0])){origins++;c=c.slice(1);}const right=countSide(c,true),left=countSide(c.map((x,i)=>i%2?neg(x):x)),axis=degree(c)-right.count-left.count+origins;if(axis<0)throw Error('inconsistent Routh count');return{degree:originalDegree,coefficients:poly(coefficients),reducedCoefficients:c,origins,right:right.count,left:left.count,axis,stable:right.count===0&&axis===0,rows:right.rows,signs:right.signs,events:right.events};}
export function hurwitzMargins(coefficients){const c=poly(coefficients),n=degree(c);if(n!==3&&n!==4)throw Error('cubic/quartic margins only');const a=c.slice().reverse();return n===3?{second:sub(mul(a[1],a[2]),mul(a[0],a[3]))}:{second:sub(mul(a[1],a[2]),mul(a[0],a[3])),third:sub(sub(mul(mul(a[1],a[2]),a[3]),mul(a[0],mul(a[3],a[3]))),mul(mul(a[1],a[1]),a[4]))};}
