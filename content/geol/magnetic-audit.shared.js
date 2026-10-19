// Fig4 field/bearing/susceptibility literals checked against full Vine–Matthews1963.
// Layer geometry and equal block widths below are an atlas model, not digitized Fig4.
import {prismField,anomalyProfile} from './ch03.shared.js';
const D=Math.PI/180;
export const VM_PROFILES={
  carl:{name:'Carlsberg Ridge (Fig4, no3)',F:37600,incl:-6,bearing:44,chi:.0027,centralChi:.0053},
  atl:{name:'Mid-Atlantic Ridge (Fig4, no2)',F:48000,incl:65,bearing:120,chi:.0027,centralChi:.0053},
  pac:{name:'Pacific grain (Fig4, no1)',F:50000,incl:60,bearing:73,chi:.0027,centralChi:.0027},
};
export function vmProfile(xs,key,{width=20,zTop=2,thick=2,reversals=true}={}){
  const p=VM_PROFILES[key],fx=Math.cos(p.incl*D)*Math.cos(-p.bearing*D),fz=Math.sin(p.incl*D),M=4*Math.PI*p.chi*p.F,extra=4*Math.PI*(p.centralChi-p.chi)*p.F;
  const terms=[];
  if(reversals)for(let m=0;m<256;m++){const n=2*m+1,k=n*Math.PI/width,atten=Math.exp(-k*zTop)*(-Math.expm1(-k*thick));terms.push({k,amplitude:M*2/Math.PI*(m%2?-1:1)/n*atten});}
  const values=xs.map(x=>{let a=0;for(const {k,amplitude}of terms)a+=amplitude*((fz*fz-fx*fx)*Math.cos(k*x)-2*fx*fz*Math.sin(k*x));if(extra){const [bx,bz]=prismField(x,0,-width/2,width/2,zTop,zTop+thick,extra*fx,extra*fz);a+=bx*fx+bz*fz;}return a;});
  return {values,profile:p,terms:terms.length};
}

// Full normal-interval rows intersecting 0–5.9Ma, original CK95 Table2 p6094.
// Historical calibration, not a current GPTS. Table3 cryptochrons are excluded.
export const CK95_NORMALS=[
  [0,.780,'C1n'],[.990,1.070,'C1r.1n'],[1.770,1.950,'C2n'],[2.140,2.150,'C2r.1n'],
  [2.581,3.040,'C2An.1n'],[3.110,3.220,'C2An.2n'],[3.330,3.580,'C2An.3n'],
  [4.180,4.290,'C3n.1n'],[4.480,4.620,'C3n.2n'],[4.800,4.890,'C3n.3n'],[4.980,5.230,'C3n.4n'],[5.894,6.137,'C3An.1n'],
];
export function datedBlocks(rate,reversals=true,T=5.9){
  const edges=[...new Set([0,T,...CK95_NORMALS.flatMap(([a,b])=>[a,b]).filter(x=>x>0&&x<T)])].sort((a,b)=>a-b),blocks=[];
  for(let i=0;i+1<edges.length;i++){
    const mid=(edges[i]+edges[i+1])/2,pol=!reversals||CK95_NORMALS.some(([a,b])=>mid>=a&&mid<b)?1:-1;
    for(const sign of[-1,1])blocks.push({x0:Math.min(sign*edges[i]*rate,sign*edges[i+1]*rate),x1:Math.max(sign*edges[i]*rate,sign*edges[i+1]*rate),s:pol*4*Math.PI*.004,pol,t0:edges[i],t1:edges[i+1]});
  }
  return blocks;
}
export function stripeModel({rate=25,incl=60,depth=3,blur=2,reversals=true,resolution=1}={}){
  const T=5.9,X=T*rate,blocks=datedBlocks(rate,reversals,T),n=Math.max(601,Math.ceil(2*X/(depth/5)))*resolution+1,dx=2*X/(n-1),h=blur>0?Math.ceil(4*blur/dx):0;
  const extended=Array.from({length:n+2*h},(_,i)=>-X+(i-h)*dx),raw=anomalyProfile(extended,blocks,{zTop:depth,thick:2,F:50000,incl,dAng:0});
  const weights=Array.from({length:2*h+1},(_,i)=>h?Math.exp(-.5*((i-h)*dx/blur)**2):1),sum=weights.reduce((s,x)=>s+x,0),xs=extended.slice(h,h+n);
  const ys=xs.map((_,i)=>weights.reduce((s,w,j)=>s+w*raw[i+j],0)/sum);
  return {T,X,blocks,xs,ys,dx,kernelRadius:h*dx,sampledMaximum:Math.max(...ys.map(Math.abs)),brunhes:2*.780*rate,jaramillo:(1.070-.990)*rate,reunion:(2.150-2.140)*rate};
}
