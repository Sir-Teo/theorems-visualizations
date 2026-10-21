// Bounded exact-integer models; use BigInt whenever powers exceed binary64 integers.
export const I={int:true,step:1};
export function integer(n,min=0,max=1_000_000){if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('Integer outside the declared finite model');return n;}
export function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;}
export const mod=(a,n)=>((a%n)+n)%n;
export function isPrime(n){if(!Number.isSafeInteger(n)||n<2)return false;for(let p=2;p*p<=n;p++)if(n%p===0)return false;return true;}
export function primes(N){integer(N);const mark=new Uint8Array(N+1),out=[];for(let p=2;p<=N;p++)if(!mark[p]){out.push(p);for(let k=p*p;k<=N;k+=p)mark[k]=1;}return out;}
export function factor(n){integer(n,1);const out=[];for(let p=2;p*p<=n;p++)if(n%p===0){let e=0;do{n/=p;e++;}while(n%p===0);out.push([p,e]);}if(n>1)out.push([n,1]);return out;}
export function divisors(n){integer(n,1);const out=[];for(let d=1;d*d<=n;d++)if(n%d===0){out.push(d);if(d*d!==n)out.push(n/d);}return out.sort((a,b)=>a-b);}
export function powmod(a,k,n){a=BigInt(a);k=BigInt(k);n=BigInt(n);if(n<=0n||k<0n)throw Error('Invalid modular exponent');let v=1n%n;a=(a%n+n)%n;while(k){if(k&1n)v=v*a%n;a=a*a%n;k>>=1n;}return Number(v);}
export function triple(m,n){integer(m,1,1000);integer(n,0,1000);if(n>=m)throw Error('Require m>n≥0');const a=m*m-n*n,b=2*m*n,c=m*m+n*n;return{a,b,c,primitive:gcd(m,n)===1&&(m-n)%2===1&&n>0,slope:n/m,point:[a/c,b/c]};}
export function twoSquares(n){integer(n);const out=[];for(let a=0;2*a*a<=n;a++){const b=Math.floor(Math.sqrt(n-a*a));if(a*a+b*b===n)out.push([a,b]);}return out;}
export function r2(n){integer(n);if(n===0)return 1;let count=0;for(const[a,b]of twoSquares(n))count+=a===0||a===b?4:8;return count;}
export const twoSquareCriterion=n=>factor(n).every(([p,e])=>p%4!==3||e%2===0);
export const jacobi2=n=>4*divisors(n).reduce((s,d)=>s+(d%4===1?1:d%4===3?-1:0),0);
export function fourSquares(n){integer(n);for(let a=0;a*a<=n;a++)for(let b=0;a*a+b*b<=n;b++){const pair=twoSquares(n-a*a-b*b)[0];if(pair)return[a,b,...pair];}throw Error('Four-square existence violated');}
export function quaternion(a,b){const[w,x,y,z]=a,[r,s,t,u]=b;return[w*r-x*s-y*t-z*u,w*s+x*r+y*u-z*t,w*t-x*u+y*r+z*s,w*u+x*t-y*s+z*r];}
export const norm4=a=>a.reduce((s,x)=>s+x*x,0);
export function r4(n){integer(n,0,10000);let c=0;for(let j=0;j<=n;j++)c+=r2(j)*r2(n-j);return c;}
export const jacobi4=n=>8*divisors(n).filter(d=>d%4!==0).reduce((s,d)=>s+d,0);
export function threeSquareObstruction(n){integer(n);if(n===0)return{a:0,reduced:0,obstructed:false};let a=0;while(n%4===0){n/=4;a++;}return{a,reduced:n,obstructed:n%8===7};}
export function threeSquares(n){integer(n);for(let a=0;a*a<=n;a++){const pair=twoSquares(n-a*a)[0];if(pair)return[a,...pair];}return null;}
export function zagierSet(p){integer(p,5,10000);if(p%4!==1||!isPrime(p))throw Error('Zagier model requires a prime congruent to1 mod4');const S=[];for(let x=1;x*x<p;x+=2){const q=(p-x*x)/4;for(const y of divisors(q))S.push([x,y,q/y]);}return S;}
export function zagier([x,y,z]){if(x===y-z||x===2*y)throw Error('Boundary excluded in prime1 mod4 domain');return x<y-z?[x+2*z,z,y-x-z]:x<2*y?[2*y-x,y,x-y+z]:[x-2*y,x-y+z,y];}
export const windmillNorm=([x,y,z])=>x*x+4*y*z;
export function powerSums(k,N){integer(k,2,8);integer(N,1,10000);const powers=[];for(let a=1;a**k<=N;a++)powers.push(a**k);const dp=new Uint16Array(N+1),last=new Uint16Array(N+1);for(let n=1;n<=N;n++){dp[n]=n;last[n]=1;for(const p of powers){if(p>n)break;if(dp[n-p]+1<dp[n]){dp[n]=dp[n-p]+1;last[n]=p;}}}return{dp,powers,representation:n=>{integer(n,0,N);const out=[];while(n){const p=last[n];out.push(p);n-=p;}return out;}};}
export const gaussianNorm=z=>z[0]*z[0]+z[1]*z[1];
export const gaussianMul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
export function gaussianDivide(a,b){const N=gaussianNorm(b);if(!N)throw Error('Division by zero');const exact=[(a[0]*b[0]+a[1]*b[1])/N,(a[1]*b[0]-a[0]*b[1])/N],q=exact.map(Math.round),p=gaussianMul(q,b),r=[a[0]-p[0],a[1]-p[1]];return{exact,q,r,norm:gaussianNorm(r),divisorNorm:N};}
export function gaussianGcd(a,b){a=[...a];b=[...b];const trace=[];while(gaussianNorm(b)){const step=gaussianDivide(a,b);trace.push({a:[...a],b:[...b],...step});a=b;b=step.r;if(trace.length>100)throw Error('Gaussian Euclid failed to descend');}const rotations=[[...a],[-a[1],a[0]],[-a[0],-a[1]],[a[1],-a[0]]],canonical=rotations.find(z=>z[0]>0&&z[1]>=0)||[0,0];return{gcd:canonical,trace};}
export function gaussianPrime([a,b]){const N=gaussianNorm([a,b]);if(N<2)return false;if(a&&b)return isPrime(N);const p=Math.abs(a||b);return isPrime(p)&&p%4===3;}
export function fermatNearMiss(n,B){integer(n,3,20);integer(B,2,150);let best=null;for(let a=1;a<=B;a++)for(let b=a;b<=B;b++){const target=BigInt(a)**BigInt(n)+BigInt(b)**BigInt(n);let lo=b,hi=2*B;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(BigInt(mid)**BigInt(n)<target)lo=mid+1;else hi=mid;}for(const c of[lo-1,lo]){if(c<1)continue;const power=BigInt(c)**BigInt(n),delta=target-power,absolute=delta<0n?-delta:delta;if(!best||absolute*best.target<best.absolute*target)best={a,b,c,n,target,power,delta,absolute};}}return best;}
export function perfectPowers(limit){const cap=BigInt(limit);if(cap<4n||cap>1_000_000_000_000n)throw Error('Perfect-power bound outside model');const values=new Map();for(let a=2n;a*a<=cap;a++){let power=a*a;for(let e=2;power<=cap;e++,power*=a){const key=power.toString();if(!values.has(key))values.set(key,[]);values.get(key).push([Number(a),e]);}}const sorted=[...values].map(([n,reps])=>({value:BigInt(n),reps})).sort((a,b)=>a.value<b.value?-1:1);return sorted.map((r,i)=>({...r,gap:i?r.value-sorted[i-1].value:null}));}
export function legendreTests(a,b,c){for(const n of[a,b,c])integer(Math.abs(n),1,500);const pairwise=gcd(a,b)===1&&gcd(a,c)===1&&gcd(b,c)===1,squarefree=[a,b,c].every(n=>factor(Math.abs(n)).every(([,e])=>e===1)),mixed=Math.min(a,b,c)<0&&Math.max(a,b,c)>0;const residue=(d,n)=>{const M=Math.abs(n);for(let r=0;r<M;r++)if(mod(r*r-d,M)===0)return r;return null;},roots=[residue(-b*c,a),residue(-a*c,b),residue(-a*b,c)];return{pairwise,squarefree,mixed,roots,applicable:pairwise&&squarefree,passes:pairwise&&squarefree&&mixed&&roots.every(r=>r!==null)};}
export function conicSearch(a,b,c,B=30){integer(B,1,100);for(let x=0;x<=B;x++)for(let y=0;y<=B;y++)for(let z=0;z<=B;z++)if((x||y||z)&&a*x*x+b*y*y+c*z*z===0)return{x,y,z};return null;}
export function ellipticPoints(p){integer(p,2,1000);if(!isPrime(p))throw Error('Prime field required');const points=[];for(let x=0;x<p;x++)for(let y=0;y<p;y++)if(mod(y*y+y-x*x*x+x*x,p)===0)points.push([x,y]);return{points,count:points.length+1,ap:p-points.length,good:p!==11};}
export function eta11(N){integer(N,1,1000);const out=Array(N+1).fill(0n);out[1]=1n;for(let n=1;n<=N;n++)for(const k of[n,11*n])for(let repeat=0;repeat<2;repeat++)for(let j=N;j>=k;j--)out[j]-=out[j-k];return out;}
export const eisensteinNorm=z=>z[0]*z[0]-z[0]*z[1]+z[1]*z[1];
export const eisensteinMul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]-a[1]*b[1]];
export function eisensteinDivide(a,b){const N=eisensteinNorm(b);if(!N)throw Error('Division by zero');const exact=[(a[0]*(b[0]-b[1])+a[1]*b[1])/N,(a[1]*b[0]-a[0]*b[1])/N];let best;for(let x=Math.floor(exact[0])-1;x<=Math.floor(exact[0])+2;x++)for(let y=Math.floor(exact[1])-1;y<=Math.floor(exact[1])+2;y++){const q=[x,y],p=eisensteinMul(q,b),r=[a[0]-p[0],a[1]-p[1]],norm=eisensteinNorm(r);if(!best||norm<best.norm)best={exact,q,r,norm,divisorNorm:N};}return best;}
export const eisensteinXY=([a,b])=>[a-b/2,Math.sqrt(3)*b/2];
