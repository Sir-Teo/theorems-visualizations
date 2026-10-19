import{blocks,ix,nbrs,greedyColour,comps}from'./ch05-a.shared.js';
/** Brooks ordering, with an explicit block reduction instead of an unproved BFS fallback. */
export function brooksPlan(H){
 if(comps(H).k!==1)throw Error('Brooks ordering requires a nonempty connected graph');
 const adj=nbrs(H),n=H.n,D=Math.max(0,...adj.map(l=>l.length)),regular=adj.every(l=>l.length===D);
 if(adj.every(l=>l.length===n-1))return{excl:'complete graph',D};if(regular&&D===2&&n%2)return{excl:'odd cycle',D};
 const dec=(alive,root)=>{const d=new Array(n).fill(-1),q=[root];d[root]=0;for(let i=0;i<q.length;i++)for(const w of adj[q[i]])if(alive[w]&&d[w]<0){d[w]=d[q[i]]+1;q.push(w);}return{d,q};};
 if(!regular){const z=adj.findIndex(l=>l.length<D),{d}=dec(new Array(n).fill(true),z);return{D,kind:'low',z,order:Array.from({length:n},(_,i)=>i).sort((a,b)=>d[b]-d[a]||a-b),note:`vertex ${z+1} has degree below $\\Delta$: decreasing distance places it last`};}
 if(D===2){const{q}=dec(new Array(n).fill(true),0);return{D,kind:'cycle',z:-1,order:q,note:'Even cycle: breadth-first distance layers alternate the two colours.'};}
 for(let z=0;z<n;z++)for(const x of adj[z])for(const y of adj[z])if(x<y&&!adj[x].includes(y)){const alive=new Array(n).fill(true);alive[x]=alive[y]=false;const{q}=dec(alive,z);if(q.length===n-2)return{D,kind:'triple',z,x,y,order:[x,y,...q.slice().reverse()],note:`$v=${z+1}$ has nonadjacent neighbours $x=${x+1}$, $y=${y+1}$; $G-x-y$ is connected`};}
 const BL=blocks(H).blocks,pending=BL.slice(),col=new Array(n).fill(-1);if(BL.length<2)throw Error('Missing Brooks triple in a 2-connected nonexceptional graph');
 while(pending.length){const bi=col.every(c=>c<0)?0:pending.findIndex(B=>B.V.filter(v=>col[v]>=0).length===1);if(bi<0)throw Error('Invalid block traversal');const B=pending.splice(bi,1)[0],map=new Map(B.V.map((v,i)=>[v,i])),BH=ix({nodes:B.V.map((_,id)=>({id})),edges:B.E.map(k=>H.E[k].slice(0,2).map(v=>map.get(v)))}),a=nbrs(BH),z=a.findIndex(l=>l.length<D),dist=new Array(BH.n).fill(-1),q=[z];if(z<0)throw Error('Proper block has no low-degree vertex');dist[z]=0;for(let i=0;i<q.length;i++)for(const w of a[q[i]])if(dist[w]<0){dist[w]=dist[q[i]]+1;q.push(w);}const r=greedyColour(BH,q.slice().reverse()),shared=B.V.find(v=>col[v]>=0),old=shared==null?-1:r.col[map.get(shared)],target=shared==null?-1:col[shared];for(const v of B.V){let c=r.col[map.get(v)];if(c===old)c=target;else if(c===target)c=old;col[v]=c;}}
 return{D,kind:'blocks',z:-1,order:Array.from({length:n},(_,i)=>i).sort((a,b)=>col[a]-col[b]||a-b),note:'Reduce at cutvertices: colour each proper block from a low-degree root, permute palettes to agree at shared vertices, then list the resulting colour classes.'};
}
/** Logarithms of actual first-moment probability bounds, without falsely drawing the base as the probability. */
export function erdosBounds(t,k,g,f){const n=10**t,eps=f/g,p=n**(eps-1),r=Math.ceil(n/(2*k));let A=0;for(let i=3;i<=g;i++)A+=n**(i*eps)/(2*i);return{cycles:Math.log10(2*A/n),independent:r*(Math.log(n)-p*(r-1)/2)/Math.LN10,n,p,r,eps};}
/** Threshold-sharp odd-component obstruction for both congruence classes of even n. */
export function factorizationObstruction(n){if(n%2||n<6)throw Error('even n>=6 required');const h=n/2,parts=n%4?[h,h]:[h-1,h+1],E=[];let start=0;for(let b=0;b<2;b++){const s=parts[b];for(let i=0;i<s;i++)for(let j=i+1;j<s;j++){const gap=j-i;if(n%4===0&&b===1&&(gap===1||gap===s-1))continue;E.push([start+i,start+j]);}start+=s;}return{n,E,d:2*Math.ceil(n/4)-2,parts};}
