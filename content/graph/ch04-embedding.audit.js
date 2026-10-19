import {ixE,planarPos as originalPlanarPos,maximalize,dmp,tutte,spread} from './ch04-z.shared.js';
// Reviewed finite drawing checks. Abstract planarity and geometric validity are distinct.
export function drawingIssues(H,pos,tolerance=1e-6) {
 const issues=[],scale=Math.max(1,...pos.flat().map(Math.abs)),eps=tolerance*scale;
 const det=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 for(let a=0;a<H.n;a++)for(let b=a+1;b<H.n;b++)if(Math.hypot(pos[a][0]-pos[b][0],pos[a][1]-pos[b][1])<=eps)issues.push({type:'coincident vertices',vertices:[a,b],edges:[]});
 for(let v=0;v<H.n;v++)for(let k=0;k<H.m;k++){const[a,b]=H.E[k];if(v===a||v===b)continue;const p=pos[a],q=pos[b],r=pos[v],len=Math.hypot(q[0]-p[0],q[1]-p[1]);if(len<=eps)continue;const t=((r[0]-p[0])*(q[0]-p[0])+(r[1]-p[1])*(q[1]-p[1]))/(len*len);if(t>=-tolerance&&t<=1+tolerance&&Math.abs(det(p,q,r))/len<=eps)issues.push({type:'vertex on another edge',vertices:[v],edges:[k]});}
 for(let i=0;i<H.m;i++)for(let j=i+1;j<H.m;j++){const[a,b]=H.E[i],[c,d]=H.E[j];if(a===c||a===d||b===c||b===d)continue;const p=pos[a],q=pos[b],r=pos[c],s=pos[d];if(det(p,q,r)*det(p,q,s)<0&&det(r,s,p)*det(r,s,q)<0)issues.push({type:'crossing edges',vertices:[],edges:[i,j]});}
 return issues;
}
export function faceComparison(FA,FB) {
 const counts=F=>{const out=new Map();for(const f of F)out.set(f.key,(out.get(f.key)||0)+1);return out;},a=counts(FA),b=counts(FB),same=FA.length===FB.length&&a.size===b.size&&[...a].every(([key,n])=>b.get(key)===n),oa=FA.find(f=>f.area<0),ob=FB.find(f=>f.area<0);
 return {same,planeExtension:same&&!!oa&&!!ob&&oa.key===ob.key,uniqueFaceMap:!([...a.values()].some(n=>n>1)),faces:FA.length};
}
export const K5_MODELS={plain:['plain','plain','plain','plain','plain'],a:['s22','plain','plain','plain','plain'],b:['s31','plain','plain','plain','plain'],c:['s211','plain','plain','plain','plain'],d:['s22','s22','plain','plain','plain']};
export function buildK5Model(pats) {
 const PAT={plain:[[1,2,3,4]],s22:[[1,2],[3,4]],s31:[[1,2,3],[4]],s211:[[1,2],[3],[4]]},gid=[],pos=[],E=[],br=[];let count=0;
 for(let i=0;i<5;i++){const angle=Math.PI/2-2*Math.PI*i/5,nb=[0,1,2,3,4].filter(j=>j!==i),groups=PAT[pats[i]].map(g=>g.map(t=>nb[t-1])),ids=groups.map((_,k)=>{const id=count++,off=(k-(groups.length-1)/2)*.42;pos.push([1.25*Math.cos(angle)+off*Math.sin(angle),1.25*Math.sin(angle)-off*Math.cos(angle)]);return id;});gid.push(groups.map((to,k)=>({id:ids[k],to})));for(let k=0;k+1<ids.length;k++)E.push([ids[k],ids[k+1]]);br.push(ids);}
 for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)E.push([gid[i].find(g=>g.to.includes(j)).id,gid[j].find(g=>g.to.includes(i)).id]);return{n:count,E,pos,br};
}

export function glueGraphs(A,B,kind) {
 const pick=N=>{if(kind==='k1')return[0];if(kind==='k2')return N.E[0].slice(0,2);const keys=new Set(N.E.map(([a,b])=>a<b?a+','+b:b+','+a));for(let a=0;a<N.n;a++)for(let b=a+1;b<N.n;b++)if(!keys.has(a+','+b))return[a,b];return null;};
 const S=pick(A),sb=pick(B);if(!S||!sb)return null;let n=A.n;const mapB=new Int32Array(B.n),posAll=A.pos.map(([x,y])=>[x*.9-1.3,y*.9]);
 B.pos.forEach(([x,y],i)=>{const k=sb.indexOf(i);if(k>=0)mapB[i]=S[k];else{mapB[i]=n++;posAll.push([x*.9+1.3,y*.9]);}});
 const E=A.E.concat(B.E.map(([a,b])=>[mapB[a],mapB[b]])),H=ixE(n,E),side=new Int32Array(n);for(let i=0;i<A.n;i++)side[i]=S.includes(i)?0:1;for(let i=A.n;i<n;i++)side[i]=2;return{H,side,S,posAll};
}

// Keep generated examples away from contacts at interactive display precision.
export function displayPlanarPos(H) {
 const original=originalPlanarPos(H);if(!original||!drawingIssues(H,original,5e-6).length)return original;
 const E=H.E.map(([a,b])=>[a,b]).concat(maximalize(H)),F=dmp(H.n,E);
 for(const wf of[1,2,4,8])for(let outer=0;outer<F.length;outer++){const p=spread(H.n,E,tutte(H.n,E,F,outer,wf),60,F[outer]);if(!drawingIssues(H,p,5e-6).length)return p;}
 return original;
}
