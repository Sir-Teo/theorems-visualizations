// Scoped spin/coupling audit; old chapter helpers remain unchanged.
import{cg as legacyCG,ylm,spinOps,spinAlong,propagator,mvec,blochOf,rotate3,cabs2,cis,cscale,ip,mscale}from'./ch07.shared.js';
export const ELECTRON_G_MAGNITUDE=2.00231930436092;
export const BOHR_HZ_PER_T=1.39962449171e10;
export const NEUTRON_GAMMA_MAGNITUDE=1.83247174e8;
export const clampUnit=x=>Math.max(-1,Math.min(1,x));
export function safeAngle(a,b){const n=Math.hypot(...a)*Math.hypot(...b);return n===0?null:Math.acos(clampUnit(a.reduce((s,x,i)=>s+x*b[i],0)/n));}
export function interference(alpha,chi,delta=0){
 const phases=[cis(-alpha/2),cis(alpha/2)],z=cis(delta);
 const pure=s=>s.reduce((sum,c,i)=>{const r=cscale(cmul(z,cmul(phases[i],c)),.5);return sum+cabs2([c[0]/2+r[0],c[1]/2+r[1]]);},0);
 return chi?pure(chi):(pure([[1,0],[0,0]])+pure([[0,0],[1,0]]))/2;
}
const cmul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
export function precession(n,omega,t,chi){const H=mscale(spinAlong(spinOps(.5),n),omega),out=mvec(propagator(H,t),chi),r=blochOf(out),r0=blochOf(chi),reference=rotate3(r0,n,omega*t);return{out,r,r0,reference,difference:Math.hypot(...r.map((x,i)=>x-reference[i])),angle:safeAngle(r,n),initialAngle:safeAngle(r0,n)};}
const halfInt=x=>Number.isFinite(x)&&x>=0&&Math.abs(2*x-Math.round(2*x))<1e-10;
const jm=(j,m)=>halfInt(j)&&Math.abs(m)<=j+1e-10&&Math.abs(j-m-Math.round(j-m))<1e-10;
export function cgSafe(a,m,b,q,J,M){if(!jm(a,m)||!jm(b,q)||!jm(J,M)||J<Math.abs(a-b)-1e-10||J>a+b+1e-10||Math.abs(J-a-b-Math.round(J-a-b))>1e-10||Math.abs(m+q-M)>1e-10)return 0;return legacyCG(a,m,b,q,J,M);}
export function cHarmonic(k,q,th,ph){return Number.isInteger(k)&&k>=0&&Number.isInteger(q)&&Math.abs(q)<=k?ylm(k,q,th,ph).map(x=>x*Math.sqrt(4*Math.PI/(2*k+1))):[0,0];}
export function gaussLegendre(N=20){const nodes=[],weights=[];for(let i=0;i<N;i++){let z=Math.cos(Math.PI*(i+.75)/(N+.5)),p=0,dp=0;for(let it=0;it<30;it++){let p0=1,p1=z;for(let n=2;n<=N;n++){const p2=((2*n-1)*z*p1-(n-1)*p0)/n;p0=p1;p1=p2;}p=N===1?z:p1;dp=N*(z*p-p0)/(z*z-1);const next=z-p/dp;if(Math.abs(next-z)<1e-15){z=next;break;}z=next;}nodes.push(z);weights.push(2/((1-z*z)*dp*dp));}return{nodes,weights};}
const rule=gaussLegendre();
export function tensorAngularRows(l,lp,op){const k=op==='2'?2:1,rows=[];for(let q=-(op==='mix'?3:k);q<=(op==='mix'?3:k);q++)for(let m=-l;m<=l;m++){const mp=m+q;if(Math.abs(mp)>lp)continue;let re=0,im=0;for(let i=0;i<rule.nodes.length;i++){const th=Math.acos(rule.nodes[i]),w=rule.weights[i]*2*Math.PI/40;for(let j=0;j<40;j++){const ph=2*Math.PI*(j+.5)/40,a=ylm(l,m,th,ph),b=ylm(lp,mp,th,ph),u=cHarmonic(k,q,th,ph),v=op==='mix'?cHarmonic(3,q,th,ph):[0,0],t=[u[0]+.9*v[0],u[1]+.9*v[1]],f=cmul(t,a);re+=w*(f[0]*b[0]+f[1]*b[1]);im+=w*(f[1]*b[0]-f[0]*b[1]);}}const c=cgSafe(l,m,k,q,lp,mp);rows.push({m,q,mp,me:re,im,c,reduced:Math.abs(c)>1e-10?Math.sqrt(2*lp+1)*re/c:null});}return rows;}
export function tensorSummary(rows){const r=rows.filter(x=>x.reduced!==null).map(x=>x.reduced),mean=r.length?r.reduce((a,b)=>a+b,0)/r.length:0,spread=r.length?Math.max(...r.map(x=>Math.abs(x-mean))):0,maxMe=Math.max(0,...rows.map(x=>Math.abs(x.me))),zeroCGNonzero=rows.filter(x=>Math.abs(x.c)<1e-10&&Math.abs(x.me)>1e-10).length;return{mean,spread,maxMe,zeroCGNonzero,ratios:r,imMax:Math.max(0,...rows.map(x=>Math.abs(x.im)))};}
