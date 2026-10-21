// Review-specific numerical routines; avoid cancellation in ill-conditioned Lagrange sums.
import { chebPts, chebW, bary } from './ch03.shared.js';
export function stableLebesgue(xs) {
  const n=xs.length, inv=xs.map((x,j)=>{let p=1;for(let k=0;k<n;k++)if(k!==j)p*=x-xs[k];return 1/Math.abs(p);});
  return x=>{if(xs.includes(x))return 1;const pre=[1],suf=new Array(n+1);suf[n]=1;for(let j=0;j<n;j++)pre.push(pre[j]*Math.abs(x-xs[j]));for(let j=n-1;j>=0;j--)suf[j]=suf[j+1]*Math.abs(x-xs[j]);let sum=0;for(let j=0;j<n;j++)sum+=pre[j]*suf[j+1]*inv[j];return sum;};
}
export function stableLebesgueMax(xs) {
  const f=stableLebesgue(xs);let L=1,x=xs[0];
  for(let j=0;j<xs.length-1;j++){const a=xs[j],b=xs[j+1],h=(b-a)/32;let best=a;for(let k=1;k<32;k++){const t=a+k*h;if(f(t)>f(best))best=t;}let lo=Math.max(a,best-h),hi=Math.min(b,best+h);for(let k=0;k<65;k++){const u=lo+(hi-lo)/3,w=hi-(hi-lo)/3;if(f(u)<f(w))lo=u;else hi=w;}const t=(lo+hi)/2,y=f(t);if(y>L){L=y;x=t;}}
  return {L,x};
}
// Exact critical-point reduction for the six real families in item 4.6 (floating arithmetic).
export function affineSupError(kind,space,a,b){
  const f={exp:Math.exp,lin:x=>x,abs:Math.abs}[kind],basis=x=>space==='lin'?x:x*x,pts=[-1,0,1];
  if(kind==='exp'){
    if(space==='lin'&&b>0){const t=Math.log(b);if(t>-1&&t<1)pts.push(t);}
    if(space==='sq'){const d=x=>Math.exp(x)-2*b*x;for(const[l,h]of[[-1,0],[0,1]])if(d(l)*d(h)<0){let lo=l,hi=h;for(let k=0;k<70;k++){const m=(lo+hi)/2;if(d(lo)*d(m)<=0)hi=m;else lo=m;}pts.push((lo+hi)/2);}}
  }else if(space==='sq'&&b!==0){if(kind==='lin'){const t=1/(2*b);if(t>-1&&t<1)pts.push(t);}else for(const t of[1/(2*b),-1/(2*b)])if(t>-1&&t<1&&Math.sign(t)===Math.sign(2*b*t))pts.push(t);}
  return Math.max(...pts.map(x=>Math.abs(f(x)-a-b*basis(x))));
}
export function stepChebInterp(c,n){const xs=chebPts(n),w=chebW(n),ys=xs.map(x=>Math.abs(x-c)<1e-14?0:x>c?1:-1);return x=>bary(xs,w,ys,x);}

// Rank-revealing normalized Padé solve. Free variables are set to zero; an inconsistent
// q(0)=1 system returns null instead of silently claiming full matching order.
export function normalizedPade(c,L,M,tol=2e-14){
 const A=Array.from({length:M},(_,i)=>Array.from({length:M+1},(_,j)=>j===M?-c[L+i+1]:(c[L+i-j]||0))),piv=[];let row=0;
 const scale=Math.max(1,...A.flat().map(Math.abs)),eps=tol*scale;
 for(let j=0;j<M&&row<M;j++){let k=row;for(let i=row+1;i<M;i++)if(Math.abs(A[i][j])>Math.abs(A[k][j]))k=i;if(Math.abs(A[k][j])<=eps)continue;[A[k],A[row]]=[A[row],A[k]];for(let i=row+1;i<M;i++){const z=A[i][j]/A[row][j];for(let h=j;h<=M;h++)A[i][h]-=z*A[row][h];}piv.push(j);row++;}
 for(let i=row;i<M;i++)if(Math.abs(A[i][M])>eps*8)return null;
 const qs=new Array(M).fill(0);for(let i=row-1;i>=0;i--){const j=piv[i];let y=A[i][M];for(let h=j+1;h<M;h++)y-=A[i][h]*qs[h];qs[j]=y/A[i][j];}
 const q=[1,...qs],p=Array.from({length:L+1},(_,i)=>q.reduce((s,x,j)=>s+(j<=i?x*c[i-j]:0),0));
 for(let i=L+1;i<=L+M;i++){const e=q.reduce((s,x,j)=>s+(i>=j?x*(c[i-j]||0):0),0);if(Math.abs(e)>1e-9*scale*Math.max(1,...q.map(Math.abs)))return null;}
 const trim=a=>{const b=a.slice(),e=tol*Math.max(1,...a.map(Math.abs));while(b.length>1&&Math.abs(b.at(-1))<=e)b.pop();return b;};return{p:trim(p),q:trim(q)};
}
export function padeWithFallback(c,L,M){let l=L,m=M,P=normalizedPade(c,l,m);while(!P&&l>0&&m>0){l--;m--;P=normalizedPade(c,l,m);}return{P,L:l,M:m,fallback:l!==L||m!==M};}
export function epsilonAudit(S){
 let prev=new Array(S.length+1).fill(0),cur=S.slice(),best={value:S[0],level:0,used:1,breakdown:false};
 for(let k=1;k<S.length;k++){const next=[];for(let i=0;i<cur.length-1;i++){const d=cur[i+1]-cur[i];next.push(Number.isFinite(d)&&d!==0&&Number.isFinite(prev[i+1])?prev[i+1]+1/d:NaN);}prev=cur;cur=next;if(k%2===0&&Number.isFinite(cur[0]))best={value:cur[0],level:k,used:k+1,breakdown:false};if(cur.some(x=>!Number.isFinite(x)))best.breakdown=true;}
 return best;
}
// Stable Newman product ratio; even n gives type (n,n). The original theorem assumes n>4.
export function newmanAudit(n){if(n<6||n%2)throw new RangeError('Newman degree must be even and at least 6');const a=Math.exp(-1/Math.sqrt(n));return x=>{const t=Math.abs(x);let q=1;for(let k=0;k<n;k++){const ak=a**k;q*=(ak-t)/(ak+t);}return t*(1-q)/(1+q);};}

// Same quadrature experiment as 4.11, exposed for independent recurrence tests.
export function orthogonalAudit(weight,NQ=400,m=9){
 const xq=Array.from({length:NQ},(_,i)=>Math.cos((2*i+1)*Math.PI/(2*NQ))),wq=xq.map(x=>Math.PI/NQ*weight(x)*Math.sqrt(1-x*x));
 const ip=(a,b)=>a.reduce((s,x,i)=>s+wq[i]*x*b[i],0),Q=[];
 for(let k=0;k<=m;k++){let u=xq.map(x=>x**k);for(let pass=0;pass<2;pass++)for(const q of Q){const z=ip(u,q);u=u.map((x,i)=>x-z*q[i]);}const norm=Math.sqrt(ip(u,u));Q.push(u.map(x=>x/norm));}
 const J=Q.map(q=>Q.map(r=>ip(xq.map((x,i)=>x*q[i]),r))),a=J.map((r,k)=>r[k]),b=J.map((r,k)=>k?r[k-1]:0),mass=wq.reduce((s,x)=>s+x,0);
 const evalAll=x=>{const out=[1/Math.sqrt(mass)];if(m)out.push((x-a[0])*out[0]/b[1]);for(let k=1;k<m;k++)out.push(((x-a[k])*out[k]-b[k]*out[k-1])/b[k+1]);return out;};
 return{J,a,b,mass,evalAll};
}

import { rationalExpBest, clenshaw } from './ch04.shared.js';
import { solveGE } from './ch03.shared.js';
const chebBasis=(n,t)=>{const a=[1];if(n)a.push(t);for(let k=1;k<n;k++)a.push(2*t*a[k]-a[k-1]);return a;};
function errorExtrema(f,M=2400){
 const xs=Array.from({length:M+1},(_,i)=>-Math.cos(Math.PI*i/M)),ys=xs.map(f),out=[];
 for(let i=0;i<=M;i++)if(Math.abs(ys[i])>=(i?Math.abs(ys[i-1]):-1)&&Math.abs(ys[i])>=(i<M?Math.abs(ys[i+1]):-1)){
  let x=xs[i];if(i&&i<M){let lo=xs[i-1],hi=xs[i+1];for(let k=0;k<48;k++){const u=lo+(hi-lo)/3,v=hi-(hi-lo)/3;if(Math.abs(f(u))<Math.abs(f(v)))lo=u;else hi=v;}x=(lo+hi)/2;}out.push({x,y:f(x)});
 }
 const alt=[];for(const p of out){const a=alt.at(-1);if(a&&Math.sign(a.y)===Math.sign(p.y)){if(Math.abs(p.y)>Math.abs(a.y))alt[alt.length-1]=p;}else alt.push(p);}return alt;
}
export function rationalExpAudit(n,svd){
 const S=rationalExpBest(n,svd,9,800),pc=S.pc.slice(),qc=S.qc.slice(),F=t=>t>=1?0:Math.exp(-9*(1+t)/(1-t));
 const rt=t=>clenshaw(pc,t)/clenshaw(qc,t),err=t=>F(t)-rt(t);let alt=[];
 for(let it=0;it<10;it++){
  alt=errorExtrema(err);while(alt.length>2*n+2){if(Math.abs(alt[0].y)<Math.abs(alt.at(-1).y))alt.shift();else alt.pop();}if(alt.length!==2*n+2)break;
  let h=Math.abs(alt[0].y);const signs=alt.map(p=>Math.sign(p.y));
  for(let nw=0;nw<8;nw++){
   const J=[],b=[];for(let i=0;i<alt.length;i++){const t=alt[i].x,T=chebBasis(n,t),q=clenshaw(qc,t),p=clenshaw(pc,t),g=F(t)-signs[i]*h;J.push([...T,...T.slice(1).map(x=>-g*x),signs[i]*q]);b.push(g*q-p);}
   const d=solveGE(J,b);if(!d||d.some(x=>!Number.isFinite(x)))break;for(let k=0;k<=n;k++)pc[k]+=d[k];for(let k=1;k<=n;k++)qc[k]+=d[n+k];h+=d[2*n+1];if(Math.max(...d.map(Math.abs))<1e-15)break;
  }
 }
 alt=errorExtrema(err);const E=Math.max(...alt.map(p=>Math.abs(p.y))),minPeak=Math.min(...alt.map(p=>Math.abs(p.y)));
 return{n,c:9,pc,qc,E,minPeak,alt,at:rt,r:x=>rt((x-9)/(x+9))};
}
export function epsilonForSeries(S,kind){const T=kind==='atan'?S.filter((_,i)=>i%2===1):S,W=epsilonAudit(T);return{...W,used:kind==='atan'?2*W.used:W.used,compressed:kind==='atan'};}
export function eulerIntegral(z){
 const f=t=>Math.exp(-t)/(1+z*t),sim=(a,b,fa,fm,fb)=>(b-a)*(fa+4*fm+fb)/6;
 const rec=(a,b,fa,fm,fb,S,tol,depth)=>{const m=(a+b)/2,l=(a+m)/2,r=(m+b)/2,fl=f(l),fr=f(r),L=sim(a,m,fa,fl,fm),R=sim(m,b,fm,fr,fb),d=L+R-S;if(depth===0||Math.abs(d)<=15*tol)return L+R+d/15;return rec(a,m,fa,fl,fm,L,tol/2,depth-1)+rec(m,b,fm,fr,fb,R,tol/2,depth-1);};
 const a=0,b=50,fa=f(a),fm=f(25),fb=f(b);return rec(a,b,fa,fm,fb,sim(a,b,fa,fm,fb),2e-15,26);
}
