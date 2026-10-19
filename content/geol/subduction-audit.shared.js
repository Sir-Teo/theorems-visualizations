// Constructed geometry/catalogue: these parameters are not fitted to an earthquake catalogue.
const D=Math.PI/180;
export function subductionSlab(dip,step=.5){
  const points=[[0,0]];let x=0,z=0;
  for(let arc=0;z<800;arc+=step){const a=(10+(dip-10)*(1-Math.exp(-(arc+step/2)/120)))*D;x+=step*Math.cos(a);z+=step*Math.sin(a);points.push([x,z]);}
  return points;
}
export function slabX(points,z){
  let lo=0,hi=points.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(points[m][1]<z)lo=m;else hi=m;}
  const a=points[lo],b=points[hi];return a[0]+(b[0]-a[0])*(z-a[1])/(b[1]-a[1]);
}
export function subductionCutoff(dip,age,rate){const phi=age*rate*Math.sin(dip*D);return{phi,zmax:Math.min(700,90+.11*phi)};}
export function subductionDensity(z,zmax){return Math.exp(-z/70)+.07+.55*Math.exp(-.5*((z-590)/55)**2)*Math.max(0,Math.min(1,(zmax-430)/200));}
export function subductionDepthTable(zmax,n=1024){
  const dz=zmax/n,weights=Array.from({length:n},(_,i)=>subductionDensity((i+.5)*dz,zmax)),total=weights.reduce((a,b)=>a+b,0),cdf=[0];
  for(const w of weights)cdf.push(cdf.at(-1)+w/total);cdf[n]=1;return{zmax,dz,cdf};
}
export function subductionQuantile(table,u){
  const {cdf,dz}=table;u=Math.max(0,Math.min(1,u));let lo=0,hi=cdf.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(cdf[m]<u)lo=m;else hi=m;}
  return (lo+(u-cdf[lo])/(cdf[hi]-cdf[lo]))*dz;
}
export function subductionFit(events){
  const es=events.filter(e=>e[1]>100);if(es.length<6)return null;
  const n=es.length,mx=es.reduce((s,e)=>s+e[0],0)/n,mz=es.reduce((s,e)=>s+e[1],0)/n;
  const xz=es.reduce((s,e)=>s+(e[0]-mx)*(e[1]-mz),0),zz=es.reduce((s,e)=>s+(e[1]-mz)**2,0),xx=es.reduce((s,e)=>s+(e[0]-mx)**2,0);
  if(!(zz>0&&xx>0))return null;const slope=xz/zz;
  return{n,mx,mz,slope,dip:Math.atan2(1,slope)/D,r2:Math.max(0,Math.min(1,xz*xz/(xx*zz)))};
}
export function subductionCatalogue({dip,age,rate,count},rng){
  const {phi,zmax}=subductionCutoff(dip,age,rate),slab=subductionSlab(dip),table=subductionDepthTable(zmax),events=[];
  for(let i=0;i<count;i++){const z=subductionQuantile(table,rng()),u=Math.max(Number.MIN_VALUE,rng()),normal=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rng());events.push([slabX(slab,z)+6*normal,z]);}
  const bins=new Array(36).fill(0);for(const e of events)bins[Math.min(35,Math.floor(e[1]/20))]++;
  const probabilities=bins.map(n=>n/events.length),fit=subductionFit(events),deepest=Math.max(...events.map(e=>e[1]));
  const fitPath=fit?[[fit.mx+fit.slope*(100-fit.mz),-100],[fit.mx+fit.slope*(zmax-fit.mz),-zmax]]:[];
  const xs=[0,...slab.map(p=>p[0]),...events.map(p=>p[0]),...fitPath.map(p=>p[0])],xmin=Math.min(...xs),xmax=Math.max(...xs),pad=Math.max(40,.03*(xmax-xmin));
  return{phi,zmax,slab,events,bins,probabilities,fit,fitPath,deepest,n:events.length,xrange:[xmin-pad,xmax+pad]};
}
