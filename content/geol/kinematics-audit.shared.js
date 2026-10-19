// Scoped to the audited 3.5–3.6 models. Angles at the interface are degrees.
import {D,R_EARTH,V,LL,dot,cross,vnorm,vscale,velAt,azDiff180} from './ch03.shared.js';

export const maximumSpeed = rate => Math.abs(rate)*D*R_EARTH; // mm/yr: km/Myr has the same numeric value
export function velocitySample(point,pole,rate){
  const r=V(point),axis=V(pole),sine=vnorm(cross(axis,r)),cosine=dot(axis,r);
  const delta=Math.atan2(sine,cosine)/D,vector=vscale(cross(axis,r),rate*D*R_EARTH);
  const speed=vnorm(vector),formula=maximumSpeed(rate)*Math.sin(delta*D);
  return {...velAt(point,pole,rate),speed,formula,vector,delta,residual:Math.abs(speed-formula),directionResolved:Math.abs(rate)>0&&sine>1e-10};
}
export function faultTangent(point,az){
  const l=point[0]*D,f=point[1]*D,a=az*D;
  const east=[-Math.sin(l),Math.cos(l),0],north=[-Math.sin(f)*Math.cos(l),-Math.sin(f)*Math.sin(l),Math.cos(f)];
  return east.map((x,i)=>Math.sin(a)*x+Math.cos(a)*north[i]);
}
export function faultDiagnostics(pole,sites,azimuths){
  const axis=V(pole),residuals=sites.map((p,i)=>{const v=velocitySample(p,pole,1);return v.directionResolved?azDiff180(v.az,azimuths[i]):null;});
  const valid=residuals.filter(x=>x!==null),loss=sites.reduce((s,p,i)=>s+dot(axis,faultTangent(p,azimuths[i]))**2,0)/sites.length;
  return {residuals,rms:valid.length===sites.length?Math.sqrt(valid.reduce((s,x)=>s+x*x,0)/valid.length):null,unresolved:sites.length-valid.length,loss};
}
// Minimize mean (axis·observed tangent)^2 on the unit sphere. This is a plane
// residual, NOT angular-azimuth least squares. Rayleigh–Ritz gives the global
// minimizer as a smallest eigenvector of the symmetric tangent Gram matrix.
export function fitFaultAxis(sites,azimuths){
  if(!sites.length||sites.length!==azimuths.length)throw Error('matching nonempty fault data required');
  const ts=sites.map((p,i)=>faultTangent(p,azimuths[i])),gram=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>ts.reduce((s,t)=>s+t[i]*t[j],0)/ts.length));
  const A=gram.map(r=>r.slice()),Q=[[1,0,0],[0,1,0],[0,0,1]];
  for(let k=0;k<60;k++){
    let p=0,q=1;for(const [i,j]of [[0,2],[1,2]])if(Math.abs(A[i][j])>Math.abs(A[p][q]))[p,q]=[i,j];
    if(Math.abs(A[p][q])<2e-16)break;
    const theta=.5*Math.atan2(2*A[p][q],A[q][q]-A[p][p]),c=Math.cos(theta),s=Math.sin(theta),ap=A[p][p],aq=A[q][q],b=A[p][q];
    A[p][p]=c*c*ap-2*s*c*b+s*s*aq;A[q][q]=s*s*ap+2*s*c*b+c*c*aq;A[p][q]=A[q][p]=0;
    for(let i=0;i<3;i++)if(i!==p&&i!==q){const x=A[i][p],y=A[i][q];A[i][p]=A[p][i]=c*x-s*y;A[i][q]=A[q][i]=s*x+c*y;}
    for(let i=0;i<3;i++){const x=Q[i][p],y=Q[i][q];Q[i][p]=c*x-s*y;Q[i][q]=s*x+c*y;}
  }
  const order=[0,1,2].sort((i,j)=>A[i][i]-A[j][j]),eigenvalues=order.map(i=>A[i][i]);let axis=Q.map(r=>r[order[0]]);
  if(axis[2]<0||(axis[2]===0&&axis[0]<0))axis=axis.map(x=>-x); // display one representative of the ± axis
  const pole=LL(axis),diagnostics=faultDiagnostics(pole,sites,azimuths);
  const residual=vnorm(gram.map((row,i)=>dot(row,axis)-eigenvalues[0]*axis[i]));
  return {pole,axis,gram,eigenvalues,eigenResidual:residual,gap:eigenvalues[1]-eigenvalues[0],...diagnostics};
}
