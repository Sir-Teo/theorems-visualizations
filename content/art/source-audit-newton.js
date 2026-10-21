// Actual1704 print p114; the blue fraction is1/10. This does not mutate older shared consumers.
import {colorCmf} from './source-audit-linear-color.js';
export const NEWTON1704_DENOMINATORS=Object.freeze([9,16,10,9,10,16,9]);
export const NEWTON1704_NAMES=Object.freeze(['red','orange','yellow','green','blue','indigo','violet']);
export const NEWTON1704_LETTERS=Object.freeze(['D','E','F','G','A','B','C']);
export const NEWTON1704_EXAMPLE=Object.freeze([10,6,5,3,2,1,1]);
export const NEWTON1704_WAVELENGTHS=Object.freeze([660,607,577,532,482,452,420]); // authored modern comparison
export const newtonPoint=(a,r=1)=>[r*Math.sin(a),r*Math.cos(a)];
const total=NEWTON1704_DENOMINATORS.reduce((s,n)=>s+1/n,0);
let angle=0;
export const NEWTON1704_ARCS=Object.freeze(NEWTON1704_DENOMINATORS.map((n,i)=>{
  const width=2*Math.PI/n/total,a0=angle;angle+=width;
  return Object.freeze({name:NEWTON1704_NAMES[i],letter:NEWTON1704_LETTERS[i],a0,a1:angle,width,centroid:Object.freeze(newtonPoint(a0+width/2,Math.sin(width/2)/(width/2)))});
}));
export function newton1704Model(weights=NEWTON1704_EXAMPLE){
  if(!Array.isArray(weights)||weights.length!==7||!Array.from({length:7},(_,i)=>Object.hasOwn(weights,i)&&typeof weights[i]==='number'&&Number.isFinite(weights[i])&&weights[i]>=0&&weights[i]<=12).every(Boolean))throw new RangeError('Seven finite continuous amounts0–12 required');
  const max=Math.max(...weights),relative=weights.map(x=>max?x/max:0),sum=relative.reduce((s,x)=>s+x,0),Z=[0,1].map(k=>sum?relative.reduce((s,x,i)=>s+x*NEWTON1704_ARCS[i].centroid[k],0)/sum:0),full=Math.hypot(...Z),directionResolved=max>0&&full>64*Number.EPSILON,angle=directionResolved?(Math.atan2(Z[0],Z[1])+2*Math.PI)%(2*Math.PI):null;
  const i=angle===null?null:NEWTON1704_ARCS.findIndex(a=>angle>=a.a0&&angle<a.a1),arc=i===null?null:Math.max(0,i),fraction=arc===null?null:(angle-NEWTON1704_ARCS[arc].a0)/NEWTON1704_ARCS[arc].width;
  const responses=NEWTON1704_WAVELENGTHS.map(colorCmf),XYZ=[0,1,2].map(k=>relative.reduce((s,x,i)=>s+x*responses[i][k],0)),XYZsum=XYZ.reduce((s,x)=>s+x,0),xy=XYZsum?XYZ.slice(0,2).map(x=>x/XYZsum):null,chromaticityWeights=responses.map((r,i)=>XYZsum?relative[i]*r.reduce((s,x)=>s+x,0)/XYZsum:0),points=responses.map(r=>{const s=r.reduce((s,x)=>s+x,0);return[r[0]/s,r[1]/s];});
  return{weights:weights.slice(),relative,sum,Z,full,directionResolved,angle,arc,fraction,Y:angle===null?null:newtonPoint(angle),empty:max===0,XYZ,xy,points,chromaticityWeights};
}
export function newton1704Balanced(){
  const ids=[0,3,6],p=ids.map(i=>NEWTON1704_ARCS[i].centroid),cross=(a,b)=>a[0]*b[1]-a[1]*b[0],w=[cross(p[1],p[2]),cross(p[2],p[0]),cross(p[0],p[1])],max=Math.max(...w.map(Math.abs)),sign=Math.sign(w[0]);
  return Array.from({length:7},(_,i)=>ids.includes(i)?Number((6*(sign*w[ids.indexOf(i)]/max)).toPrecision(15)):0);
}
