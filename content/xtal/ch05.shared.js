// Chapter-local crystallographic convention: a_i·b_j=δij, frequencies in cycles/length.
export const TAU=2*Math.PI;
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export const add=(a,b)=>a.map((x,i)=>x+b[i]);
export const scale=(a,t)=>a.map(x=>x*t);
export const norm=a=>Math.hypot(...a);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const det2=([a,b])=>a[0]*b[1]-a[1]*b[0];
export function dual2([a,b]){const d=det2([a,b]);return [[b[1]/d,-b[0]/d],[-a[1]/d,a[0]/d]];}
export const combine=(A,idx)=>A.reduce((s,a,i)=>add(s,scale(a,idx[i])),A[0].map(()=>0));
export const volume3=A=>Math.abs(dot(A[0],cross(A[1],A[2])));
export function dual3(A){const d=dot(A[0],cross(A[1],A[2]));return [cross(A[1],A[2]),cross(A[2],A[0]),cross(A[0],A[1])].map(x=>scale(x,1/d));}
export const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
export function planeData(A,h,k){const B=dual2(A),g=combine(B,[h,k]),q=gcd(h,k),length=norm(g);return {g,q,length,phaseSpacing:length?1/length:null,occupiedSpacing:length?q/length:null};}
export function lineBox(g,m,R){const ps=[];for(let axis=0;axis<2;axis++)for(const z of [-R,R]){const j=1-axis;if(Math.abs(g[j])<1e-14)continue;const p=[];p[axis]=z;p[j]=(m-g[axis]*z)/g[j];if(Math.abs(p[j])<=R+1e-10&&!ps.some(q=>norm(add(p,scale(q,-1)))<1e-9))ps.push(p);}return ps.length>=2?ps.slice(0,2):null;}
export function cubic(kind,a=1){return kind==='fcc'?[[0,a/2,a/2],[a/2,0,a/2],[a/2,a/2,0]]:[[-a/2,a/2,a/2],[a/2,-a/2,a/2],[a/2,a/2,-a/2]];}
export function bzNormals(kind,a=1){const out=[];if(kind==='fcc'){for(let j=0;j<3;j++)for(const z of [-2,2]){const p=[0,0,0];p[j]=z/a;out.push(p);}for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])out.push([x/a,y/a,z/a]);}else{for(let j=0;j<3;j++)for(const x of [-1,1])for(const y of [-1,1]){const p=[x/a,y/a];p.splice(j,0,0);out.push(p);}}return out;}
export function polyhedron(gs){const vertices=[];for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++)for(let k=j+1;k<gs.length;k++){const rows=[gs[i],gs[j],gs[k]],d=dot(rows[0],cross(rows[1],rows[2]));if(Math.abs(d)<1e-12)continue;const rhs=rows.map(g=>dot(g,g)/2),p=[0,1,2].map(c=>(rhs[0]*cross(rows[1],rows[2])[c]+rhs[1]*cross(rows[2],rows[0])[c]+rhs[2]*cross(rows[0],rows[1])[c])/d);if(gs.every(g=>dot(g,p)<=dot(g,g)/2+1e-8)&&!vertices.some(q=>norm(add(p,scale(q,-1)))<1e-8))vertices.push(p);}
const faces=gs.map(g=>{const ps=vertices.filter(p=>Math.abs(dot(g,p)-dot(g,g)/2)<1e-8);if(ps.length<3)return null;const center=scale(ps.reduce(add,[0,0,0]),1/ps.length),u=scale(add(ps[0],scale(center,-1)),1/norm(add(ps[0],scale(center,-1)))),v=cross(scale(g,1/norm(g)),u);ps.sort((a,b)=>Math.atan2(dot(add(a,scale(center,-1)),v),dot(add(a,scale(center,-1)),u))-Math.atan2(dot(add(b,scale(center,-1)),v),dot(add(b,scale(center,-1)),u)));return ps;}).filter(Boolean);
let volume=0;for(const f of faces)for(let i=1;i<f.length-1;i++)volume+=Math.abs(dot(f[0],cross(f[i],f[i+1])))/6;return {vertices,faces,volume,edges:faces.reduce((n,f)=>n+f.length,0)/2};}
export const reciprocalPresets={square:[[1,0],[0,1]],rectangle:[[1,0],[0,1.5]],hexagon:[[1,0],[.5,Math.sqrt(3)/2]]};
export function neighbors2(B,R=1.8){const inverse=dual2(B),radius=2*Math.SQRT2*R,n=Math.ceil(radius*Math.max(...inverse.map(norm)))+1,gs=[];for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++){if(!i&&!j)continue;const g=combine(B,[i,j]);if(norm(g)<=radius+1e-10)gs.push(g);}return gs;}
export function zoneAt(p,gs){let count=0,boundary=false;for(const g of gs){const t=dot(p,g)-dot(g,g)/2;if(t>1e-10)count++;if(Math.abs(t)<=1e-10)boundary=true;}return {zone:count+1,boundary};}
export function firstZone(gs,R=10){let p=[[-R,-R],[R,-R],[R,R],[-R,R]];for(const g of gs){const b=dot(g,g)/2,out=[];for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],fa=dot(g,a)-b,fc=dot(g,c)-b;if(fa<=1e-10)out.push(a);if((fa<0&&fc>0)||(fa>0&&fc<0)){const t=fa/(fa-fc);out.push(a.map((x,j)=>x+t*(c[j]-x)));}}p=out;}return p;}
export const polygonArea=p=>Math.abs(p.reduce((s,a,i)=>s+a[0]*p[(i+1)%p.length][1]-a[1]*p[(i+1)%p.length][0],0))/2;
export function pulsePartial(u,w,N){let s=w;for(let m=1;m<=N;m++)s+=2*Math.sin(Math.PI*m*w)/(Math.PI*m)*Math.cos(TAU*m*(u-w/2));return s;}
export function pulseError(w,N){let energy=w*w;for(let m=1;m<=N;m++)energy+=2*(Math.sin(Math.PI*m*w)/(Math.PI*m))**2;return Math.sqrt(Math.max(0,w*w-energy*energy));}
export function fourierValue(mode,u,v,w,N,delta){if(mode==='off lattice')return Math.cos(TAU*((1+delta)*u+v));if(mode==='smooth')return N<1?0:Math.cos(TAU*u)+.4*Math.sin(TAU*(u+v));return pulsePartial(u,w,N)*pulsePartial(v,w,N);}
export const wrap=x=>{const r=x%1;return r<0?r+1:r===0?0:r;};
export const pulse=(u,v,w)=>+(wrap(u)<w&&wrap(v)<w);
export function rowOffsets(M,seed){let state=seed>>>0;return Array.from({length:2*M+1},()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296-.5;});}
export function patchAmplitude(q,A,M,delta=0,seed=7){const n=2*M+1,t=dot(q,A[0]),u=dot(q,A[1]),offsets=rowOffsets(M,seed);let ar=0,ai=0,br=0,bi=0;for(let j=-M;j<=M;j++){ar+=Math.cos(TAU*j*t);ai-=Math.sin(TAU*j*t);const phase=TAU*(j*u+delta*offsets[j+M]*t);br+=Math.cos(phase);bi-=Math.sin(phase);}const re=(ar*br-ai*bi)/(n*n),im=(ar*bi+ai*br)/(n*n);return {re,im,intensity:re*re+im*im};}
