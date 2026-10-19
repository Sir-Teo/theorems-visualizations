// Reviewed numerical helpers for the specified lattice examples and finite Markov chains.
export function stableResolvent(w,r,x,y=0,z=0) {
 let loss=0,im=0;for(const[a,b,c,p]of w){const t=a*x+b*y+c*z;loss+=p*2*Math.sin(t/2)**2;im+=p*Math.sin(t);}
 const re=(1-r)+r*loss,imag=r*im;return re===0&&imag===0?Infinity:re/(re*re+imag*imag);
}
function adaptive(f,a,b,tol=2e-6,depth=26) {
 const m=(a+b)/2,fa=f(a),fm=f(m),fb=f(b),S=(b-a)*(fa+4*fm+fb)/6;
 function rec(a,b,fa,fm,fb,S,depth){const m=(a+b)/2,l=(a+m)/2,h=(m+b)/2,fl=f(l),fh=f(h),L=(m-a)*(fa+4*fl+fm)/6,R=(b-m)*(fm+4*fh+fb)/6,next=L+R;if(depth===0||Math.abs(next-S)<=15*tol*Math.max(1,Math.abs(next)))return next+(next-S)/15;return rec(a,m,fa,fl,fm,L,depth-1)+rec(m,b,fm,fh,fb,R,depth-1);}return rec(a,b,fa,fm,fb,S,depth);
}
// The five demo walks are symmetric in the sign of each coordinate at the level of Re resolvent.
export function auditedShell(w,d,r,{rmin=1e-8,rmax=1,nr=400}={}) {
 if(d===1&&r===1){const drift=Math.abs(w.reduce((a,e)=>a+e[0]*e[3],0));const at=eta=>eta>=rmax?0:drift<1e-15?2*(1/Math.tan(eta/2)-1/Math.tan(rmax/2)):2/drift*(Math.atan(Math.tan(rmax/2)/drift)-Math.atan(Math.tan(eta/2)/drift));const rad=Float64Array.from({length:nr+1},(_,i)=>rmin*(rmax/rmin)**(i/nr)),tail=Float64Array.from(rad,at);return{rad,tail,total:tail[0],central:0,at};}
 const logStep=Math.log(rmax/rmin)/nr,rad=Float64Array.from({length:nr+1},(_,i)=>rmin*Math.exp(i*logStep)),tail=new Float64Array(nr+1);
 const dirs=[];if(d===3){const K=400,ga=Math.PI*(3-Math.sqrt(5));for(let j=0;j<K;j++){const z=1-2*(j+.5)/K,q=Math.sqrt(1-z*z);dirs.push([q*Math.cos(ga*j),q*Math.sin(ga*j),z,4*Math.PI/K]);}}
 let acc=0;for(let i=nr-1;i>=0;i--){const rr=Math.sqrt(rad[i]*rad[i+1]);let angular=0;if(d===1)angular=2*stableResolvent(w,r,rr);else if(d===2)angular=4*adaptive(t=>stableResolvent(w,r,rr*Math.cos(t),rr*Math.sin(t)),0,Math.PI/2);else for(const[x,y,z,wt]of dirs)angular+=wt*stableResolvent(w,r,rr*x,rr*y,rr*z);acc+=angular*rr**d*logStep;tail[i]=acc;}
 // For r<1, the small central ball is essentially constant; rmin=1e-8 is far below every displayed regularization width.
 const volume=d===1?2:d===2?Math.PI:4*Math.PI/3,central=r<1?volume*rmin**d/(1-r):0;
 const at=eta=>{if(eta<=rmin)return tail[0];if(eta>=rmax)return 0;const index=Math.log(eta/rmin)/logStep,i=Math.floor(index),t=index-i;return tail[i]*(1-t)+tail[i+1]*t;};
 return {rad,tail,total:acc+central,central,at};
}
export function exactCouplingTail(P,pi,x0,N) {
 const n=P.length,out=[];let mass=Array.from({length:n},(_,i)=>Float64Array.from({length:n},(_,j)=>i===x0&&j!==i?pi[j]:0));
 for(let t=0;t<=N;t++){out.push(mass.reduce((s,row)=>s+row.reduce((a,b)=>a+b,0),0));const next=Array.from({length:n},()=>new Float64Array(n));for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(mass[i][j])for(let a=0;a<n;a++)if(P[i][a])for(let b=0;b<n;b++)if(a!==b&&P[j][b])next[a][b]+=mass[i][j]*P[i][a]*P[j][b];mass=next;}return out;
}
// Requires a finite strongly connected directed graph.
export function graphPeriod(adj,start=0) {
 const dist=Array(adj.length).fill(-1),queue=[start];dist[start]=0;for(let i=0;i<queue.length;i++)for(const v of adj[queue[i]])if(dist[v]<0){dist[v]=dist[queue[i]]+1;queue.push(v);}
 const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};let g=0;for(const u of queue)for(const v of adj[u])if(dist[v]>=0)g=gcd(g,dist[u]+1-dist[v]);return g;
}
