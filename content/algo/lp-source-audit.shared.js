// Computations for source-reviewed LP duality, Klee–Minty, barriers and the 1956 planar procedure.
import {vertices,combos,clipHalf} from './ch11.shared.js';
export const kmLP=n=>({c:Array.from({length:n},(_,j)=>10**(n-1-j)),rows:Array.from({length:n},(_,i)=>({a:Array.from({length:n},(_,j)=>j<i?2*10**(i-j):j===i?1:0),op:'<=',b:100**i}))});
export const POLY_CONS=[{a:[-1,0],b:-.5},{a:[0,-1],b:-.5},{a:[1,1],b:8},{a:[1,0],b:6},{a:[0,1],b:5},{a:[-1,1],b:3}];
export function polygon(cons=POLY_CONS){let P=[[0,0],[20,0],[20,20],[0,20]];for(const q of cons)P=clipHalf(P,q.a,q.b);return P;}
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
export function barrierState(cons,c,t,x){
 const sl=cons.map(q=>q.b-dot(q.a,x));if(sl.some(x=>!(x>0)))return{phi:-Infinity,g:[NaN,NaN],H:[[NaN,NaN],[NaN,NaN]],sl};
 const g=c.map(v=>t*v),H=[[0,0],[0,0]];let phi=t*dot(c,x);
 cons.forEach((q,k)=>{phi+=Math.log(sl[k]);for(let i=0;i<2;i++){g[i]-=q.a[i]/sl[k];for(let j=0;j<2;j++)H[i][j]+=q.a[i]*q.a[j]/sl[k]**2;}});return{phi,g,H,sl};
}
export function barrierPoint(cons,c,t,start=[3,2]){
 let x=start.slice(),iterations=0,status='iteration-limit';
 for(;iterations<80;iterations++){
  const {phi,g,H}=barrierState(cons,c,t,x),det=H[0][0]*H[1][1]-H[0][1]**2;if(!(det>0)||!Number.isFinite(phi)){status='numerical-failure';break;}
  const d=[(H[1][1]*g[0]-H[0][1]*g[1])/det,(-H[1][0]*g[0]+H[0][0]*g[1])/det],decrement=dot(g,d);
  if(decrement<1e-14){status='tolerance-reached';break;}
  let step=1;for(let i=0;i<cons.length;i++){const a=dot(cons[i].a,d);if(a>0)step=Math.min(step,.99*(cons[i].b-dot(cons[i].a,x))/a);}
  while(step>1e-15&&barrierState(cons,c,t,x.map((v,j)=>v+step*d[j])).phi<phi+.01*step*decrement)step*=.5;
  if(!(step>1e-15)){status='line-search-limit';break;}x=x.map((v,j)=>v+step*d[j]);
 }
 const B=barrierState(cons,c,t,x),y=B.sl.map(sl=>1/(t*sl)),residual=[0,1].map(j=>cons.reduce((s,q,i)=>s+q.a[j]*y[i],0)-c[j]);
 return{t,x,status,iterations,sl:B.sl,y,residual:Math.hypot(...residual),decrement:(()=>{const{g,H}=B,d=H[0][0]*H[1][1]-H[0][1]**2;return(g[0]**2*H[1][1]-2*g[0]*g[1]*H[0][1]+g[1]**2*H[0][0])/d;})()};
}
export function barrierPath(cons,c,N=100){let x=[3,2];return Array.from({length:N+1},(_,k)=>{const q=barrierPoint(cons,c,10**(-1.5+k*5/N),x);x=q.x;return q;});}
export function ellipsoidRun(cons,cobj,K=60){
 let c=[4,3],B=[[10,0],[0,10]],best=null;const out=[],poly=polygon(cons),opt=Math.max(...poly.map(p=>dot(cobj,p)));
 for(let k=0;k<=K;k++){
  const viol=cons.find(q=>dot(q.a,c)>q.b+1e-12),feas=!viol;if(feas)best=best===null?dot(cobj,c):Math.max(best,dot(cobj,c));
  const Q=B.map(row=>B.map(col=>dot(row,col))),area=Math.PI*B[0][0]*B[1][1],a=viol?viol.a:cobj.map(x=>-x);
  if(!(area>0)||!B.flat().every(Number.isFinite))break;
  out.push({c:c.slice(),B:B.map(r=>r.slice()),Q,feas,area,best,cut:a.slice(),opt});
  const z=[B[0][0]*a[0]+B[1][0]*a[1],B[1][1]*a[1]],zn=Math.hypot(...z),u=z.map(x=>x/zn),g=B.map(row=>dot(row,u));c=c.map((x,i)=>x-g[i]/3);
  // Square-root update avoids cancellation in det(Q) and Q22-Q12²/Q11.
  const alpha=1/Math.sqrt(3)-1,M=[[0,0],[0,0]];for(let i=0;i<2;i++)for(let j=0;j<2;j++)M[i][j]=Math.sqrt(4/3)*(B[i][j]+alpha*g[i]*u[j]);
  const r=Math.hypot(...M[0]),p=(M[1][0]*M[0][0]+M[1][1]*M[0][1])/r,q=(M[1][1]*M[0][0]-M[1][0]*M[0][1])/r;B=[[r,0],[p,q]];
 }return out;
}
export function detInteger(A){
 const n=A.length;if(!n)return 1;const M=A.map(r=>r.map(BigInt));let sign=1n,prev=1n;
 for(let k=0;k<n-1;k++){let p=k;while(p<n&&M[p][k]===0n)p++;if(p===n)return 0;if(p!==k){[M[p],M[k]]=[M[k],M[p]];sign=-sign;}const pivot=M[k][k];for(let i=k+1;i<n;i++)for(let j=k+1;j<n;j++)M[i][j]=(M[i][j]*pivot-M[i][k]*M[k][j])/prev;for(let i=k+1;i<n;i++)M[i][k]=0n;prev=pivot;}return Number(sign*M[n-1][n-1]);
}
export function matchingPolytope(E,n=6){
 const m=E.length,M=Array.from({length:n},(_,r)=>E.map(([a,b])=>a===r||b===r?1:0));let bad=null,checked=0;
 outer:for(let k=1;k<=Math.min(n,m);k++)for(const R0 of combos(n,k))for(const C0 of combos(m,k)){const d=detInteger(R0.map(r=>C0.map(c=>M[r][c])));checked++;if(Math.abs(d)>1){bad={R0,C0,d};break outer;}}
 const G=[...M,...Array.from({length:m},(_,i)=>Array.from({length:m},(_,j)=>i===j?-1:0))],h=[...Array(n).fill(1),...Array(m).fill(0)],V=m?vertices(G,h,m):[{x:[],tight:[]}],frac=V.filter(q=>q.x.some(x=>Math.abs(x-Math.round(x))>1e-7)),col=Array(n).fill(-1),adj=Array.from({length:n},()=>[]);E.forEach(([a,b])=>{adj[a].push(b);adj[b].push(a);});let bip=true;
 for(let r=0;r<n;r++)if(col[r]<0){col[r]=0;const q=[r];for(let i=0;i<q.length;i++)for(const w of adj[q[i]])if(col[w]<0){col[w]=1-col[q[i]];q.push(w);}else if(col[w]===col[q[i]])bip=false;}
 return{M,bad,checked,V,frac,bip,m};
}
export const PLANAR_NET={pos:{s:[.8,3],a:[3,5],b:[3,1],c:[6.3,5],d:[6.3,1],t:[9,3]},arcs:[['s','a',10],['s','b',7],['a','c',6],['a','b',5],['b','d',9],['c','d',4],['c','t',8],['d','t',8]]};
export function undirectedCuts(I,E,s='s',t='t'){
 const mid=I.filter(x=>x!==s&&x!==t),out=[];for(let mask=0;mask<2**mid.length;mask++){const S=new Set([s,...mid.filter((_,j)=>mask>>j&1)]),cap=E.reduce((z,[u,v,c])=>z+(S.has(u)!==S.has(v)?c:0),0);out.push({S,cap});}return out;
}
// Clockwise outer-face walk, loop-erased to a simple chain. Positions/edges are a fixed planar ladder.
export function topChain(pos,E,remaining,s='s',t='t'){
 const adj=Object.fromEntries(Object.keys(pos).map(v=>[v,[]]));E.forEach(([u,v],i)=>{if(remaining[i]>1e-12){adj[u].push({v,i});adj[v].push({v:u,i});}});
 for(const u of Object.keys(adj))adj[u].sort((a,b)=>Math.atan2(pos[a.v][1]-pos[u][1],pos[a.v][0]-pos[u][0])-Math.atan2(pos[b.v][1]-pos[u][1],pos[b.v][0]-pos[u][0]));
 if(!adj[s].length)return null;
 let u=s,next=adj[s].at(-1),path=[s],edges=[],seen=new Set();
 while(next){const key=u+'>'+next.v;if(seen.has(key))return null;seen.add(key);const v=next.v,at=path.indexOf(v);if(at>=0){path=path.slice(0,at+1);edges=edges.slice(0,at);}else{path.push(v);edges.push(next.i);}if(v===t)return{nodes:path,edges};const a=adj[v],back=a.findIndex(q=>q.v===u);u=v;next=a[(back+a.length-1)%a.length];}
 return null;
}
export function planarChainRun(pos,E){
 let remaining=E.map(e=>e[2]),used=E.map(()=>0),value=0;const chains=[],frames=[];
 const snap=(type,extra={})=>frames.push({type,remaining:remaining.slice(),used:used.slice(),value,chains:chains.map(c=>({...c,edges:c.edges.slice()})),...extra});snap('init',{note:'Original 1956 setting: undirected links, nonnegative flows on source–sink chains.'});
 for(let k=0;k<=E.length;k++){
  const path=topChain(pos,E,remaining);if(!path){const best=undirectedCuts(Object.keys(pos),E).reduce((a,b)=>a.cap<=b.cap?a:b);snap('stop',{S:best.S,cap:best.cap,note:'No positive-capacity source–sink chain remains. Independent exhaustive cut enumeration supplies the displayed minimum-cut certificate.'});break;}
  const amount=Math.min(...path.edges.map(i=>remaining[i]));snap('chain',{path,amount,note:'Choose the topmost boundary chain and subtract its smallest remaining capacity.'});for(const i of path.edges){remaining[i]-=amount;used[i]+=amount;}value+=amount;chains.push({...path,amount});snap('push',{path,amount,note:'Record this nonnegative chain flow; delete every saturated link. At least one link is removed per round.'});
 }return{frames,value,chains,used,remaining};
}
