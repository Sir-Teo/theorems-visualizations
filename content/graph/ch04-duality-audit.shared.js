import {ix,allCycles,allBonds}from'./ch04-z.shared.js';
const key=F=>Array.from(F,x=>x?1:0).join('');
/** Full iff check, including bonds not in the image of the cycle family. */
export function abstractDualAudit(H,D,pi,cycles=(H.E.some(([a,b])=>a===b)||new Set(H.E.map(([a,b])=>a<b?a+','+b:b+','+a)).size<H.m?edgeSubsetCycles(H.n,H.E.map(([a,b])=>[a,b])):allCycles(H))){
 const m=H.m;if(D.ends.length!==m||pi.length!==m||new Set(pi).size!==m||pi.some(x=>!Number.isInteger(x)||x<0||x>=m))return{kind:'bijection',E:new Uint8Array(m)};
 const DH=ix({nodes:Array.from({length:D.n},(_,id)=>({id})),edges:D.ends.map(([a,b])=>[a,b])},{multi:true}),bonds=allBonds(DH),bondKeys=new Set(bonds.map(c=>key(c.E))),image=new Set();
 for(const c of cycles){const F=new Uint8Array(m);c.E.forEach((x,k)=>{if(x)F[pi[k]]=1;});const k=key(F);image.add(k);if(!bondKeys.has(k))return{kind:'cycle',E:c.E};}
 for(const b of bonds)if(!image.has(key(b.E)))return{kind:'bond',E:Uint8Array.from(pi,k=>b.E[k])};
 return null;
}
/** Exact cycle subsets of a small multigraph, including loops and double edges. */
export function edgeSubsetCycles(n,ends){const out=[];if(ends.length>20)throw new Error('subset verification limited to 20 edges');for(let mask=1;mask<2**ends.length;mask++){
 const deg=new Array(n).fill(0),adj=Array.from({length:n},()=>[]),F=ends.map((_,k)=>+(!!(mask&(1<<k))));ends.forEach(([a,b],k)=>{if(F[k]){deg[a]++;deg[b]++;adj[a].push(b);adj[b].push(a);}});if(deg.some(d=>d!==0&&d!==2))continue;const vs=deg.flatMap((d,i)=>d?[i]:[]),seen=new Set([vs[0]]),q=[vs[0]];for(let i=0;i<q.length;i++)for(const j of adj[q[i]])if(!seen.has(j)){seen.add(j);q.push(j);}if(seen.size===vs.length)out.push({vs,E:Uint8Array.from(F)});
 }return out;}
export function incidenceRealizer(n,E,coordinates){
 const vertexOrders=[0,1,2].map(i=>Array.from({length:n},(_,u)=>u).sort((a,b)=>coordinates[a][i]-coordinates[b][i]||coordinates[a][(i+1)%3]-coordinates[b][(i+1)%3]||a-b));
 const orders=vertexOrders.map(order=>{const rank=[];order.forEach((v,k)=>rank[v]=k);return Array.from({length:n+E.length},(_,k)=>k).sort((a,b)=>{const score=k=>k<n?2*rank[k]:2*Math.max(rank[E[k-n][0]],rank[E[k-n][1]])+1;return score(a)-score(b)||a-b;});});
 const ranks=orders.map(L=>{const r=[];L.forEach((x,k)=>r[x]=k);return r;}),N=n+E.length;let bad=0;
 for(let a=0;a<N;a++)for(let b=0;b<N;b++){if(a===b)continue;const want=a<n&&b>=n&&E[b-n].includes(a),got=ranks.every(r=>r[a]<r[b]);if(want!==got)bad++;}
 return{orders,vertexOrders,bad,checked:N*(N-1),valid:bad===0};
}
/** Full local orientation/colour rules and root paths; no constant success labels. */
export function schnyderCertificate(n,E,pos,out){
 const errors=[],inner=E.filter(([a,b])=>a>=3||b>=3),directed=out.flat().filter(([a,b])=>a>=3||b>=3),k=(a,b)=>a<b?a+','+b:b+','+a;
 for(const [a,b]of inner){const es=directed.filter(([u,v])=>k(u,v)===k(a,b));if(es.length!==1)errors.push('edge orientation');}
 for(const [a,b,c]of directed)if(b<3&&c!==b+1||a<3)errors.push('outer rule');
 const paths=Array.from({length:n},()=>[]);let cyclicOrder=null;
 for(let v=3;v<n;v++){
  const arcs=directed.filter(([a])=>a===v);for(let c=1;c<=3;c++)if(arcs.filter(e=>e[2]===c).length!==1)errors.push('outdegree');
  const around=directed.filter(([a,b])=>a===v||b===v).sort((e,f)=>{const w=e[0]===v?e[1]:e[0],z=f[0]===v?f[1]:f[0];return Math.atan2(pos[w][1]-pos[v][1],pos[w][0]-pos[v][0])-Math.atan2(pos[z][1]-pos[v][1],pos[z][0]-pos[v][0]);});
  const outs=around.flatMap((e,i)=>e[0]===v?[i]:[]),seq=outs.map(i=>around[i][2]);if(seq.length===3&&new Set(seq).size===3&&seq.includes(1)&&seq.includes(2)&&seq.includes(3)){while(seq[0]!==1)seq.push(seq.shift());const s=seq.join();if(cyclicOrder===null)cyclicOrder=s;else if(cyclicOrder!==s)errors.push('cyclic order');}
  around.forEach((e,i)=>{if(e[1]!==v)return;let prev,next;for(let t=1;t<=around.length;t++){const q=around[(i-t+around.length)%around.length];if(q[0]===v){prev=q[2];break;}}for(let t=1;t<=around.length;t++){const q=around[(i+t)%around.length];if(q[0]===v){next=q[2];break;}}if(prev===e[2]||next===e[2]||prev===next)errors.push('incoming sector');});
  for(let c=1;c<=3;c++){const p=[v],seen=new Set(p);let u=v;while(u!==c-1&&p.length<=n){const es=out[u].filter(e=>e[2]===c);if(es.length!==1)break;u=es[0][1];if(seen.has(u))break;seen.add(u);p.push(u);}if(u!==c-1)errors.push('root path');paths[v].push(p);}
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)if(paths[v][i].slice(1).some(x=>paths[v][j].slice(1).includes(x)))errors.push('path intersection');
 }
 return{valid:errors.length===0,errors,paths};
}
/** Robust straight-line embedding check: counts vertex coincidences, edge overlaps and contacts too. */
export function drawingDefects(n,E,P){const bad=[],cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),on=(p,a,b)=>Math.abs(cross(a,b,p))<1e-10&&p[0]>=Math.min(a[0],b[0])-1e-10&&p[0]<=Math.max(a[0],b[0])+1e-10&&p[1]>=Math.min(a[1],b[1])-1e-10&&p[1]<=Math.max(a[1],b[1])+1e-10;
 for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(Math.hypot(P[a][0]-P[b][0],P[a][1]-P[b][1])<1e-10)bad.push('coincident vertices');
 for(const[a,b]of E)for(let v=0;v<n;v++)if(v!==a&&v!==b&&on(P[v],P[a],P[b]))bad.push('vertex on edge');
 for(let i=0;i<E.length;i++)for(let j=i+1;j<E.length;j++){const[a,b]=E[i],[c,d]=E[j];if(a===c||a===d||b===c||b===d)continue;const p=P[a],q=P[b],r=P[c],s=P[d];if(cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0||on(r,p,q)||on(s,p,q)||on(p,r,s)||on(q,r,s))bad.push('edge intersection');}return bad;
}
