export const IUCR='https://www.iucr.org/what-we-do/education/pamphlets/reciprocal-lattice';
export const MIT='https://math.mit.edu/~vwg/classnotes-spring05.pdf';
export const PS='https://sites.lsa.umich.edu/barvinok/wp-content/uploads/sites/1434/2025/05/latticenotes669.pdf';
export const fmt=(x,d=4)=>Number(x).toFixed(d);
export const continuous={step:'any',fmt:x=>x.toFixed(3)};
export const chart=(v,title,xlabel='x',ylabel='y',extra={})=>v.stage({x:[-2,2],y:[-2,2],axes:'box',gutter:true,height:350,title,xlabel,ylabel,...extra});
export const path=(s,ps,style={})=>s.path(ps,{color:'accent',width:2,...style});
export function lattice(s,A,N=2,r=2.3){for(let i=-N;i<=N;i++)for(let j=-N;j<=N;j++){const p=A[0].map((x,k)=>i*x+j*A[1][k]);if(Math.abs(p[0])<=r&&Math.abs(p[1])<=r)s.dot(...p,{r:3,color:'muted'});}}
export function vectors(s,A){A.forEach((p,i)=>s.arrow(0,0,...p,{color:i?'orange':'accent',width:2.5,head:7}));s.dot(0,0,{r:4,color:'ink'});}
