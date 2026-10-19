// Synthetic parameter choices, not a table of measurements of named metals.
export const grainSets=[
{id:'A',label:'synthetic A: large slope',s0:80,k:.6,G:82,b:.248,nu:.29},
{id:'B',label:'synthetic B: small intercept',s0:25,k:.11,G:48,b:.256,nu:.34},
{id:'C',label:'synthetic C: small slope',s0:20,k:.06,G:26,b:.286,nu:.34},
{id:'D',label:'synthetic D: intermediate slope',s0:80,k:.4,G:44,b:.295,nu:.32}];
export const grainTaylorFactor=3.06;
export const grainYield=(m,dUm)=>m.s0+1000*m.k/Math.sqrt(dUm);
export const asymptoticPile=(m,dM)=>Math.PI*(1-m.nu)*(m.k*1e6/Math.sqrt(dM)/grainTaylorFactor)*(dM/2)/(m.G*1e9*m.b*1e-9);
const cache=new Map();
// Zeros of L^1_(n-1)(2x) solve sum_{k!=j}1/(xj-xk)=1 with a locked x0=0.
// Tridiagonal Laguerre Jacobi matrix, eigenvalues by Sturm-count bisection.
export function lockedPile(n){
 if(!Number.isInteger(n)||n<1||n>512)throw new RangeError('pile count must be an integer1..512');
 if(cache.has(n))return cache.get(n);if(n<=1)return[0];const m=n-1,diag=Array.from({length:m},(_,i)=>2*i+2),off2=Array.from({length:m-1},(_,i)=>(i+1)*(i+2));
 const count=z=>{let p=diag[0]-z;if(Math.abs(p)<1e-200)p=-1e-200;let c=p<0?1:0;for(let i=1;i<m;i++){p=diag[i]-z-off2[i-1]/p;if(Math.abs(p)<1e-200)p=-1e-200;if(p<0)c++;}return c;};
 const roots=[0];for(let k=0;k<m;k++){let lo=0,hi=4*m+4;for(let j=0;j<65;j++){const z=(lo+hi)/2;if(count(z)<=k)lo=z;else hi=z;}roots.push((lo+hi)/4);}cache.set(n,roots);return roots;
}
export function pileCertificate(n){const x=lockedPile(n);let residual=0;for(let j=1;j<n;j++){let f=-1;for(let k=0;k<n;k++)if(k!==j)f+=1/(x[j]-x[k]);residual=Math.max(residual,Math.abs(f));}return{positions:x,residual};}
export function fittedPile(lengthInUnits){if(!(lengthInUnits>=0&&Number.isFinite(lengthInUnits)))throw new RangeError('invalid band length');let lo=1,hi=2;while(lockedPile(hi).at(-1)<=lengthInUnits&&hi<512){lo=hi;hi*=2;}if(hi===512&&lockedPile(hi).at(-1)<=lengthInUnits)return{n:512,capped:true,...pileCertificate(512)};while(hi-lo>1){const mid=(lo+hi)>>1;if(lockedPile(mid).at(-1)<=lengthInUnits)lo=mid;else hi=mid;}return{n:lo,capped:false,...pileCertificate(lo),nextLength:lockedPile(lo+1).at(-1)};}
export function competingStrength(m,dNm,dcNm,exponent){const hp=grainYield(m,dNm/1000),peak=grainYield(m,dcNm/1000),boundary=peak*(dNm/dcNm)**exponent;return{hp,boundary,value:Math.min(hp,boundary),peak};}
export const cubicBoundaryFraction=(d,delta=1)=>1-Math.max(0,1-delta/d)**3;
export function closestCell(seeds,x,y){let best=-1,d1=Infinity;for(let i=0;i<seeds.length;i++){const d=(seeds[i].x-x)**2+(seeds[i].y-y)**2;if(d<d1){d1=d;best=i;}}if(best<0)return null;let edge=Infinity;const a=seeds[best];for(let i=0;i<seeds.length;i++){if(i===best)continue;const b=seeds[i],D=Math.hypot(a.x-b.x,a.y-b.y);if(D>0)edge=Math.min(edge,((b.x-x)**2+(b.y-y)**2-d1)/(2*D));}return{index:best,edge};}
