// INFO5 finite channels: bits, exact finite enumerations, explicit numerical limits.
export const fmt=(x,d=6)=>x===0?'0':Math.abs(x)<1e-4||Math.abs(x)>=1e5?x.toExponential(4):x.toFixed(d);
export const O={step:'any',decimals:4},I={step:1,int:true};
export const axes=(title,x,y,extra={})=>({title,x,y,axes:'box',gutter:true,height:310,...extra});
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const sum=a=>a.reduce((s,x)=>s+x,0);
const L=Math.LN2;
export const entropy=p=>-sum(p.map(x=>x>0?x*Math.log2(x):0));
export const binaryEntropy=p=>p===0||p===1?0:-(p*Math.log(p)+(1-p)*Math.log1p(-p))/L;
export function bscCapacity(p){const x=1-2*p;if(Math.abs(x)<.2){let term=x*x,total=0;for(let k=1;k<100;k++){const add=term/((2*k)*(2*k-1));total+=add;if(add===0||add<Math.abs(total)*1e-17)break;term*=x*x;}return total/L;}return 1-binaryEntropy(p);}
export const bsc=p=>[[1-p,p],[p,1-p]];
export const bec=e=>[[1-e,0,e],[0,1-e,e]];
export function cyclicChannel(p=.5,n=5){return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>j===i?1-p:j===(i+1)%n?p:0));}
export function logSum(xs){const m=Math.max(...xs);return m===-Infinity?m:m+Math.log(sum(xs.map(x=>Math.exp(x-m))));}
// Nonnegative Poisson-form KL terms avoid subtraction of nearly equal entropies.
function term(p,logq,q){if(p===0)return q;const ell=q>0&&Math.abs(p-q)<.1*q?Math.log1p((p-q)/q):Math.log(p)-logq;if(Math.abs(ell)<.1){let total=0,t=ell*ell/2;total=t;for(let k=3;k<40;k++){t*=-ell/k;total+=t;if(Math.abs(t)<Math.abs(total)*1e-17)break;}return p*total;}return p*(ell-1)+q;}
function poissonDelta(q,delta){if(delta===0)return 0;const u=delta/q;if(Math.abs(u)<.1){let power=u*u,total=power/2;for(let k=3;k<45;k++){power*=u;const add=(k%2?-1:1)*power/(k*(k-1));total+=add;if(Math.abs(add)<Math.abs(total)*1e-17)break;}return q*total;}const a=q+delta;return a===0?q:a*Math.log1p(u)-delta;}
export function bscInformation(noise,t){const x=1-2*noise;if(t===0||t===1||x===0)return 0;if(Math.abs(x)<.2){const u=Math.min(t,1-t),logz=Math.log1p(-2*u);let power=x*x,total=0;for(let k=1;k<100;k++){const loss=-Math.expm1(2*k*logz),add=power*loss/((2*k)*(2*k-1));total+=add;if(add===0||add<Math.abs(total)*1e-17)break;power*=x*x;}return total/L;}if(noise===0||noise===1)return binaryEntropy(t);return null;}
export function channelInfo(W,p){
 const n=W[0].length,logq=Array.from({length:n},(_,j)=>logSum(W.map((row,i)=>p[i]>0&&row[j]>0?Math.log(p[i])+Math.log(row[j]):-Infinity))),q=logq.map(Math.exp);
 let d=W.map(row=>sum(row.map((x,j)=>logq[j]===-Infinity?(x===0?0:Infinity):term(x,logq[j],q[j])))/L);
 // For two almost equal rows, compute each displacement from the exact
 // weighted row difference instead of subtracting a rounded output mixture.
 if(W.length===2){for(let i=0;i<2;i++)d[i]=sum(W[0].map((a,j)=>{const b=W[1][j],binary=n===2&&W[0][0]===1-W[0][1]&&W[1][1]===1-W[1][0],s=1-W[0][1],contrast=(s-W[1][0])+((1-s)-W[0][1]),delta=binary?(j===0?-contrast:contrast):b-a;if(a>0&&b>0&&Math.abs(delta)<.1*Math.min(a,b))return poissonDelta(q[j],(i===0?-p[1]:p[0])*delta);return logq[j]===-Infinity?(W[i][j]===0?0:Infinity):term(W[i][j],logq[j],q[j]);}))/L;}
 const symmetric=W.length===2&&n===2&&W[0][1]===W[1][0]&&W[0][0]===W[1][1]&&W[0][0]===1-W[0][1],noise=symmetric?W[0][1]:undefined,stable=noise===undefined?null:bscInformation(noise,p[1]);
 if(stable!==null&&Math.abs(1-2*noise)<.2){const x=1-2*noise,t=p[1];d=t===.5?[bscCapacity(noise),bscCapacity(noise)]:[sum([poissonDelta(q[0],t*x),poissonDelta(q[1],-t*x)])/L,sum([poissonDelta(q[0],-(1-t)*x),poissonDelta(q[1],(1-t)*x)])/L];}
 const single=p.filter(x=>x>0).length<=1,same=W.every(row=>row.every((x,j)=>x===W[0][j]));
 return{q,logq,d,mi:same||single?0:stable!==null?stable:sum(p.map((x,i)=>x===0?0:x*d[i]))};
}
export function arimoto(W,iterations=60){let p=W.map(()=>1/W.length);const history=[];for(let k=0;k<=iterations;k++){const z=channelInfo(W,p);history.push({p:[...p],lower:z.mi,upper:Math.max(...z.d),...z});if(k===iterations)break;const lp=p.map((x,i)=>Math.log(x)+L*z.d[i]),den=logSum(lp);p=lp.map(x=>Math.exp(x-den));}return{...history.at(-1),history};}
export function weakSymmetry(W){const row=[...W[0]].sort((a,b)=>a-b),cols=W[0].map((_,j)=>sum(W.map(r=>r[j]))),sameRows=W.every(r=>[...r].sort((a,b)=>a-b).every((x,j)=>Math.abs(x-row[j])<1e-12)),equalCols=cols.every(x=>Math.abs(x-cols[0])<1e-12);return{sameRows,equalCols,cols,weak:sameRows&&equalCols};}
export const hamming=(a,b)=>{let x=a^b,n=0;while(x){n+=x&1;x>>>=1;}return n;};
export const bits=(x,n)=>x.toString(2).padStart(n,'0');
export function seeded(seed=17){let state=seed>>>0;return()=>{state=(1664525*state+1013904223)>>>0;return(state+.5)/4294967296;};}
export function codebook(n=6,M=4,seed=17,mode='random'){if(mode==='repeat')return Array.from({length:M},(_,j)=>Math.round(j*((1<<n)-1)/(M-1)));const rand=seeded(seed);return Array.from({length:M},()=>Math.floor(rand()*(1<<n)));}
export function logTransition(k,n,p){if(p===.5)return -n*L;if(p===0)return k===0?0:-Infinity;if(p===1)return k===n?0:-Infinity;return k*Math.log(p)+(n-k)*Math.log1p(-p);}
// Sum errors directly in log space, rather than losing tiny errors to 1-success.
export function codeRisk(book,n,p,decoder='ml',eps=.2){
 const M=book.length,errors=Array.from({length:M},()=>[]),received=[];
 for(let y=0;y<(1<<n);y++){
  const distances=book.map(x=>hamming(x,y)),logs=distances.map(k=>logTransition(k,n,p));let chosen=-1;
  if(decoder==='ml'){chosen=0;for(let m=1;m<M;m++)if(p<.5?distances[m]<distances[chosen]:p>.5?distances[m]>distances[chosen]:false)chosen=m;}
  else {const cand=distances.map((k,m)=>noiseTypical(k,n,p,eps)?m:-1).filter(m=>m>=0);if(cand.length===1)chosen=cand[0];}
  for(let m=0;m<M;m++)if(chosen!==m)errors[m].push(logs[m]);received.push({y,chosen,distances});
 }
 const logErrors=errors.map(logSum),per=p===.5?errors.map(a=>a.length/(1<<n)):logErrors.map(x=>Math.min(1,Math.exp(x))),logAverage=p===.5?Math.log(sum(per)/M):Math.min(0,logSum(logErrors)-Math.log(M));
 return{per,average:Math.exp(logAverage),logAverage,max:Math.max(...per),received,duplicates:M-new Set(book).size,rate:Math.log2(M)/n};
}
function exactEmpirical(k,n,p){const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,p);const raw=view.getBigUint64(0),encoded=Number((raw>>52n)&2047n),e=encoded===0?-1074:encoded-1075,mantissa=(raw&((1n<<52n)-1n))+(encoded===0?0n:1n<<52n);return(BigInt(k)<<BigInt(-e))===BigInt(n)*mantissa;}
export function noiseTypical(k,n,p,eps){if(p===.5)return true;if(eps===0&&p>0&&p<1)return exactEmpirical(k,n,p);if(p===0)return k===0;if(p===1)return k===n;const logRatio=p>.25&&p<.75?Math.log1p((1-2*p)/p):Math.log1p(-p)-Math.log(p);return Math.abs((k/n-p)*logRatio/L)<=eps;}
export function binomial(n,p){const logs=Array.from({length:n+1},(_,k)=>{let choose=0;for(let j=1;j<=k;j++)choose+=Math.log((n-j+1)/j);return choose+logTransition(k,n,p);});return logs.map(Math.exp);}
export function typicalPair(n,p,eps){const truth=binomial(n,p),independent=binomial(n,.5),accepted=truth.map((_,k)=>noiseTypical(k,n,p,eps));return{truth,independent,accepted,trueMass:sum(truth.filter((_,k)=>accepted[k])),falseMass:sum(independent.filter((_,k)=>accepted[k])),packing:Math.min(1,2**(-n*(bscCapacity(p)-3*eps)))};}
export function codingBound(n,M,p,gamma=1){const masses=binomial(n,p),threshold=Math.log2(M)+gamma,tail=sum(masses.filter((_,k)=>{const l=logTransition(k,n,p);return l!==-Infinity&&n+l/L<=threshold+1e-13;}));return{tail,penalty:2**(-gamma),bound:Math.min(1,tail+2**(-gamma)),threshold};}
export const converse=(n,R,C)=>R<=0?0:Math.max(0,1-(C+1/n)/R);
export function feedbackBEC(k,e,n){const prob=binomial(n,1-e),failure=sum(prob.slice(0,k));return{failure,expected:e===1?Infinity:k/(1-e),throughput:1-e,successes:prob};}
// Optimal fixed-length source compressor retains M most likely binary words;
// any ties have the same mass. Overflow is accumulated directly.
export function sourceOverflow(k,q,M){let left=Math.min(2**k,Math.max(0,Math.floor(M))),overflow=0;const classes=Array.from({length:k+1},(_,j)=>{let count=1;for(let i=1;i<=j;i++)count*=((k-i+1)/i);count=Math.round(count);return{j,count,log:logTransition(j,k,q)};}).sort((a,b)=>b.log-a.log);for(const c of classes){const take=Math.min(left,c.count);left-=take;overflow+=(c.count-take)*Math.exp(c.log);}return Math.max(0,Math.min(1,overflow));}
export function pentagon(n=2){const codes=n===1?[0,2]:Array.from({length:5},(_,j)=>[j,2*j%5]);return{codes,size:codes.length,rate:Math.log2(codes.length)/n,bound:5**(n/2)};}
export const confusable=(a,b)=>a===b||(a-b+5)%5===1||(b-a+5)%5===1;
export const pentagonVector=j=>{const a=Math.sqrt(1-1/Math.sqrt(5)),theta=2*Math.PI*j/5;return[a*Math.cos(theta),a*Math.sin(theta),5**(-.25)];};
export function constrained(n=12){let a=1,b=1;const counts=[1];for(let j=1;j<=n;j++){const next=a+b;counts.push(next);b=a;a=next;}const phi=(1+Math.sqrt(5))/2,P=[[1/phi,1/(phi*phi)],[1,0]],mu=[phi*phi/(phi*phi+1),1/(phi*phi+1)];return{counts,phi,P,mu,capacity:Math.log2(phi),entropy:sum(mu.map((x,i)=>x*entropy(P[i])))};}
export function gallagerE0(rho,p){if(rho===0)return 0;const x=Math.abs(1-2*p),s=1/(1+rho);if(x===0)return 0;if(x===1)return rho;if(x<.2){let coeff=1,power=1,total=0;for(let k=1;k<=100;k++){coeff*=(s-k+1)/k;power*=x;if(k%2===0){const add=coeff*power;total+=add;if(add===0||Math.abs(add)<Math.abs(total)*1e-17)break;}}return-(1+rho)*Math.log1p(total)/L;}const logMean=logSum([s*Math.log1p(x),s*Math.log1p(-x)])-L;return-(1+rho)*logMean/L;}
export function randomExponent(R,p){const C=bscCapacity(p);if(R>=C)return{rho:0,exponent:0,resolved:true};if(p===0||p===1)return{rho:1,exponent:C-R,resolved:true};if(C-R<=1e-6*C)return{rho:0,exponent:0,resolved:false};const f=rho=>gallagerE0(rho,p)-rho*R;let a=0,b=1;const t=(Math.sqrt(5)-1)/2;let c=b-t*(b-a),d=a+t*(b-a);for(let j=0;j<90;j++){if(f(c)>f(d)){b=d;d=c;c=b-t*(b-a);}else{a=c;c=d;d=a+t*(b-a);}}const rho=[0,1,(a+b)/2].sort((a,b)=>f(b)-f(a))[0];return{rho,exponent:Math.max(0,f(rho)),resolved:true};}
export const horizontal=(s,y,o={})=>s.line(s.xr[0]+3/Math.abs(s.sx),y,s.xr[1]-3/Math.abs(s.sx),y,{width:1.3,...o});
export const vertical=(s,x,o={})=>s.line(x,s.yr[0]+3/Math.abs(s.sy),x,s.yr[1]-3/Math.abs(s.sy),{width:1.3,...o});
