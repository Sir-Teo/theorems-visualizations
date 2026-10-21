// Dedicated review helpers. Existing shared graph geometry is preserved.
import {regionsOf,distSeg,planeOf,faceStruct,crossPairs,pgFaces,pgAddable,pgAddOne} from './ch04-a.shared.js';
const TAU=2*Math.PI;
export const radialLower={blob:.6,star:.58,pear:.7,source:1};
const profile=(kind,t)=>kind==='source'?1:kind==='blob'?1+.28*Math.cos(3*t)+.12*Math.sin(2*t+.6):kind==='star'?1+.42*Math.cos(5*t):.8+.28*(1+Math.cos(t-1.2))+.1*Math.cos(2*t);
export function polygonRadius(kind,t,N=80){
 const u=((t%TAU)+TAU)%TAU,k=Math.min(N-1,Math.floor(u/TAU*N)),a=TAU*k/N,b=TAU*(k+1)/N,p=[profile(kind,a)*Math.cos(a),profile(kind,a)*Math.sin(a)],q=[profile(kind,b)*Math.cos(b),profile(kind,b)*Math.sin(b)],v=[Math.cos(u),Math.sin(u)];
 return (p[0]*q[1]-p[1]*q[0])/(v[0]*(q[1]-p[1])-v[1]*(q[0]-p[0]));
}
export function angularMap(t,angles,reverse=false){const u=(((reverse?-t:t)%TAU)+TAU)%TAU,k=Math.min(3,Math.floor(u/(Math.PI/2))),f=(u-k*Math.PI/2)/(Math.PI/2);return angles[k]+f*((k===3?angles[0]+TAU:angles[k+1])-angles[k]);}
export function conePoint(r,t,kind,angles,reverse=false){const a=angularMap(t,angles,reverse),rho=polygonRadius(kind,a);return [r*rho*Math.cos(a),r*rho*Math.sin(a)];}
export function coneInverse(x,y,kind,angles,reverse=false){
 if(x===0&&y===0)return {r:0,t:0};let a=Math.atan2(y,x);while(a<angles[0])a+=TAU;while(a>=angles[0]+TAU)a-=TAU;let k=0;while(k<3&&a>=angles[k+1])k++;const end=k===3?angles[0]+TAU:angles[k+1],u=k*Math.PI/2+(a-angles[k])/(end-angles[k])*Math.PI/2;
 return {r:Math.hypot(x,y)/polygonRadius(kind,a),t:reverse?-u:u};
}
export function coneMeshAngles(kind,angles,reverse=false){
 const values=Array.from({length:161},(_,i)=>TAU*i/160);
 for(let i=0;i<80;i++){const a=TAU*i/80,r=polygonRadius(kind,a),t=coneInverse(r*Math.cos(a),r*Math.sin(a),kind,angles,reverse).t;values.push(((t%TAU)+TAU)%TAU);}
 return [...new Set(values)].sort((a,b)=>a-b);
}
export function complementProbe(parts,point,tolerance=.02){
 const R=regionsOf(parts),{pl,F}=R,isolated=[],used=new Set(pl.E.flat());
 for(let i=0;i<pl.P.length;i++)if(!used.has(i)&&!pl.E.some(([a,b])=>distSeg(pl.P[i],pl.P[a],pl.P[b]).d<1e-7)&&!isolated.some(p=>Math.hypot(p[0]-pl.P[i][0],p[1]-pl.P[i][1])<1e-7))isolated.push(pl.P[i]);
 const distance=Math.min(...pl.P.map(p=>Math.hypot(point[0]-p[0],point[1]-p[1])),...pl.E.map(([a,b])=>distSeg(point,pl.P[a],pl.P[b]).d)),near=distance<=tolerance,cur=near?null:F.locate(...point);
 const frontierPoints=isolated.filter(p=>F.locate(...p)===cur);return {...R,near,distance,cur,frontierPoints,allFrontier:!near&&F.faces[cur].edges.size===pl.E.length&&frontierPoints.length===isolated.length};
}
export function checkedPlaneState(G){const pl=planeOf(G),bad=crossPairs(pl.P,pl.E,.05);for(let i=0;i<pl.P.length;i++)for(let j=0;j<i;j++)if(Math.hypot(pl.P[i][0]-pl.P[j][0],pl.P[i][1]-pl.P[j][1])<.08)bad.push({type:'coincident vertices',x:pl.P[i][0],y:pl.P[i][1]});return {...pl,bad,F:bad.length?null:faceStruct(pl.P,pl.E)};}
export function checkedPlaneGuard(G,st,after){
 const snap=()=>new Map(G.nodes.map(n=>[String(n.id),[n.x,n.y]]));let good=snap();st.msg='';
 G.onChange=(kind,obj)=>{const bad=checkedPlaneState(G).bad.length;if(bad){if(kind==='add-edge')G.removeEdge(obj);else if(kind==='add-node')G.removeNode(obj.id);else if(kind==='move'){const p=good.get(String(obj.id));if(p){obj.x=p[0];obj.y=p[1];}}st.msg='Edit refused: vertices must stay distinct and edges must stay disjoint except at common endpoints.';}else st.msg='';good=snap();if(after)after(kind,obj);};return {reset(){good=snap();st.msg='';}};
}
export function triangulateAttempt(pg,limit=60){let added=0;while(added<limit&&pgAddOne(pg))added++;const F=pgFaces(pg),remaining=pgAddable(pg,F).length;return {added,remaining,triangulation:F.faces.every(f=>f.rlen===3),limited:added===limit&&remaining>0};}
