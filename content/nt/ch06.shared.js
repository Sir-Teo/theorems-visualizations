// Exact arithmetic drives the classifications. Numbers are used only for plots.
export const abs=n=>n<0n?-n:n;
export function gcd(a,b){a=abs(a);b=abs(b);while(b)[a,b]=[b,a%b];return a;}
export function floorDiv(a,b){if(!b)throw Error('zero divisor');const q=a/b,r=a%b;return q+(r&&((r<0n)!==(b<0n))?-1n:0n);}
export function isqrt(n){if(n<0n)throw Error('negative radicand');if(n<2n)return n;let x=1n<<BigInt(Math.ceil(n.toString(2).length/2));for(;;){const y=(x+n/x)/2n;if(y>=x)return x;x=y;}}
export const rational=(p,q)=>{p=BigInt(p);q=BigInt(q);if(!q)throw Error('zero denominator');if(q<0n){p=-p;q=-q;}const g=gcd(p,q);return{p:p/g,q:q/g};};
export function farey(N){const a=[];for(let q=1;q<=N;q++)for(let p=0;p<=q;p++)if(gcd(BigInt(p),BigInt(q))===1n)a.push({p:BigInt(p),q:BigInt(q)});return a.sort((a,b)=>a.p*b.q<b.p*a.q?-1:1);}
export const determinant=(a,b)=>a.p*b.q-b.p*a.q;
export const mediant=(a,b)=>({p:a.p+b.p,q:a.q+b.q});
export function stern(p,q){({p,q}=rational(p,q));if(p<=0n)throw Error('positive target required');let l={p:0n,q:1n},r={p:1n,q:0n},path='',rows=[];for(;;){const m=mediant(l,r);rows.push({l:{...l},r:{...r},m:{...m}});const d=p*m.q-m.p*q;if(!d)return{path,rows,target:{p,q}};if(d<0n){path+='L';r=m;}else{path+='R';l=m;}if(rows.length>10000)throw Error('path exceeds limit');}}
export function continued(p,q,limit=10000){({p,q}=rational(p,q));const a=[],rows=[];while(q&&a.length<limit){const k=floorDiv(p,q),r=p-k*q;a.push(k);rows.push({p,q,a:k,r});[p,q]=[q,r];}return{a,rows,terminated:q===0n};}
export function convergents(a){let pp=0n,p=1n,qq=1n,q=0n;return a.map((digit,n)=>{const k=BigInt(digit),np=k*p+pp,nq=k*q+qq,det=np*q-p*nq;[pp,p,qq,q]=[p,np,q,nq];return{n,a:k,p,q,det};});}
export function surd(D,A=0,B=1){D=BigInt(D);A=BigInt(A);B=BigInt(B);if(D<=0n||isqrt(D)**2n===D||B<=0n)return null;D*=B*B;let P=A*B,Q=B*B;const root=isqrt(D),seen=new Map(),rows=[],a=[];for(let n=0;n<10000;n++){const key=`${P},${Q}`;if(seen.has(key)){const start=seen.get(key);return{D,a,rows,start,period:a.slice(start),prefix:a.slice(0,start)};}seen.set(key,n);const digit=floorDiv(P+root+(Q<0n?1n:0n),Q);rows.push({P,Q,a:digit});a.push(digit);P=digit*Q-P;Q=(D-P*P)/Q;}throw Error('quadratic period exceeds limit');}
export const digits=(s,N)=>Array.from({length:N},(_,i)=>i<s.start?s.a[i]:s.period[(i-s.start)%s.period.length]);
export const eDigits=N=>Array.from({length:N},(_,i)=>BigInt(i===0?2:i%3===2?2*((i+1)/3):1));
export function pell(D){const s=surd(D);if(!s)return null;const L=s.period.length,index=(L%2?2*L:L)-1,c=convergents(digits(s,index+1)),minus=L%2?c[L-1]:null;return{...s,L,index,plus:c[index],minus,convergents:c};}
export function unitMultiply(a,b,D){D=BigInt(D);return{p:a.p*b.p+D*a.q*b.q,q:a.p*b.q+a.q*b.p};}
export function powers(D,N){const f=pell(D);if(!f)return[];let a={p:1n,q:0n};return Array.from({length:N},()=>{a=unitMultiply(a,f.plus,D);return a;});}
export function latticePell(D,B,sign=1){D=BigInt(D);const out=[];for(let y=1n;y<=BigInt(B);y++){const z=D*y*y+BigInt(sign);if(z<0n)continue;const x=isqrt(z);if(x*x===z)out.push({p:x,q:y});}return out;}
export function signSurd(A,B,D){A=BigInt(A);B=BigInt(B);D=BigInt(D);if(!B)return Math.sign(Number(A));if(!A)return Math.sign(Number(B));if((A>0n)===(B>0n))return A>0n?1:-1;const d=A*A-D*B*B;return d===0n?0:(d>0n?(A>0n?1:-1):(B>0n?1:-1));}
// Compare |q sqrt(D)-p| / q^kind, where kind is 0 (second) or 1 (first).
export function compareError(a,b,D,kind=0){const sa=signSurd(-a.p,a.q,D),sb=signSurd(-b.p,b.q,D),da=kind?a.q:1n,db=kind?b.q:1n;return signSurd(-BigInt(sa)*a.p*db+BigInt(sb)*b.p*da,BigInt(sa)*a.q*db-BigInt(sb)*b.q*da,D);}
export function approximationRecords(D,N,kind=0){D=BigInt(D);if(isqrt(D)**2n===D)throw Error('irrational target required');let best=null;const rows=[];for(let q=1n;q<=BigInt(N);q++){let p=isqrt(D*q*q);if(4n*D*q*q>(2n*p+1n)**2n)p++;const a={p,q};const record=!best||compareError(a,best,D,kind)<0;if(record)best=a;const norm=abs(p*p-D*q*q);const error=Number(norm)/(Number(q)*Math.sqrt(Number(D))+Number(p))/(kind?Number(q):1);rows.push({...a,record,error});}return rows;}
export function logBig(n){n=abs(n);if(!n)return-Infinity;const s=n.toString();return Math.log(Number(s.slice(0,15)))+Math.max(0,s.length-15)*Math.LN10;}
// e lies strictly between sum_{j=0}^N 1/j! and that sum + 1/(N N!).
export function eInterval(N=240){let f=1n,s=1n;for(let j=1;j<=N;j++){f*=BigInt(j);s=s*BigInt(j)+1n;}return{lo:{p:s*BigInt(N),q:f*BigInt(N)},hi:{p:s*BigInt(N)+1n,q:f*BigInt(N)}};}
export function commonDigits(lo,hi,N){let a=continued(lo.p,lo.q,N).a,b=continued(hi.p,hi.q,N).a,n=0;while(n<Math.min(a.length,b.length)&&a[n]===b[n])n++;return a.slice(0,n);}
export function errorInterval(c,I){const a=c.p*I.lo.q-I.lo.p*c.q,b=c.p*I.hi.q-I.hi.p*c.q,da=c.q*I.lo.q,db=c.q*I.hi.q;const crossing=(a>=0n&&b<=0n)||(a<=0n&&b>=0n);const aa=abs(a),bb=abs(b),low=aa*db<bb*da?{p:aa,q:da}:{p:bb,q:db},high=aa*db>bb*da?{p:aa,q:da}:{p:bb,q:db};return{low:crossing?{p:0n,q:1n}:low,high,logMid:(logBig(high.p)-logBig(high.q))/Math.LN10};}
export function seededInterval(seed,bits=2048){let state=(seed>>>0)||1,n=0n;for(let i=0;i<Math.ceil(bits/32);i++){state^=state<<13;state^=state>>>17;state^=state<<5;n=(n<<32n)|BigInt(state>>>0);}n>>=BigInt(Math.ceil(bits/32)*32-bits);const q=1n<<BigInt(bits);return{lo:{p:n,q},hi:{p:n+1n,q}};}
export function gaussSample(seed,count,iteration,K=10){const bins=Array(K+1).fill(0);let retained=0;for(let j=0;j<count;j++){const I=seededInterval((seed+Math.imul(j+1,2654435761))>>>0,256),a=commonDigits(I.lo,I.hi,iteration+2);if(a.length>iteration+1){const digit=a[iteration+1];bins[digit>BigInt(K)?K:Number(digit)-1]++;retained++;}}return{bins,retained,count};}
export const gaussMass=k=>Math.log1p(1/(k*(k+2)))/Math.LN2;
export const gaussTail=K=>Math.log1p(1/(K+1))/Math.LN2;
export function khinchinBounds(M=100000){let sum=0;for(let k=2;k<=M;k++)sum+=Math.log(k)*gaussMass(k);return{logLow:sum,logHigh:sum+(Math.log(M)+1)/(M*Math.LN2)};}
export const levyLog=Math.PI**2/(12*Math.LN2);
export function runningStatistics(a){const c=convergents(a);let sum=0;return c.slice(1).map((x,i)=>{sum+=logBig(x.a);return{n:i+1,kLog:sum/(i+1),lLog:logBig(x.q)/(i+1)};});}
