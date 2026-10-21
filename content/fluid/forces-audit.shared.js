// Scoped force quadrature: density1; analytic mapped boundary tangent, no chord substitution.
export function pressureForce(P,n=1440,{wake=false,base=0}={}){
 let Fx=0,Fy=0,front=0,rear=0;const cp=[],modified=[],surface=[],normals=[];
 const ca=Math.cos(P.alpha),sa=Math.sin(P.alpha),step=2*Math.PI/n;
 for(let j=0;j<n;j++){
  const t=(j+.5)*step,zeta=[P.zeta0[0]+P.R*Math.cos(t),P.zeta0[1]+P.R*Math.sin(t)],z=P.zOf(zeta),u=P.vel(zeta),d=P.dz(zeta),dr=[-P.R*Math.sin(t),P.R*Math.cos(t)],dx=d[0]*dr[0]-d[1]*dr[1],dy=d[1]*dr[0]+d[0]*dr[1];
  const raw=1-(u[0]**2+u[1]**2)/P.U**2,isRear=z[0]*ca+z[1]*sa>=0,c=wake&&isRear?base:raw,p=.5*P.U**2*c,fx=-p*dy*step,fy=p*dx*step,D=ca*fx+sa*fy;
  Fx+=fx;Fy+=fy;if(isRear)rear+=D;else front+=D;
  cp.push([360*(j+.5)/n,raw]);modified.push([360*(j+.5)/n,c]);surface.push(z);normals.push([dy,-dx]);
 }
 return{Fx,Fy,D:ca*Fx+sa*Fy,L:-sa*Fx+ca*Fy,front,rear,cp,modified,surface,normals};
}
export function forceReference(U,G,alpha=0){return{Fx:-U*G*Math.sin(alpha),Fy:U*G*Math.cos(alpha)};}
export function cylinderForce(hat,n=720){
 const G=4*Math.PI*hat,cp=[];let Fx=0,Fy=0;for(let j=0;j<n;j++){const t=2*Math.PI*(j+.5)/n,c=1-4*(Math.sin(t)+hat)**2,p=c/2,ds=2*Math.PI/n;Fx-=p*Math.cos(t)*ds;Fy-=p*Math.sin(t)*ds;cp.push([360*(j+.5)/n,c]);}
 const stagnation=hat<=1?[[-Math.sqrt(1-hat*hat),-hat],[Math.sqrt(1-hat*hat),-hat]]:[[0,-hat-Math.sqrt(hat*hat-1)]];
 return{G,Fx,Fy,cp,stagnation,arrow:.12*Fy};
}
export function fitPoints(points,{padding=.12,minX=2,minY=2}={}){
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),loX=Math.min(-minX,...xs),hiX=Math.max(minX,...xs),loY=Math.min(-minY,...ys),hiY=Math.max(minY,...ys),px=padding*(hiX-loX),py=padding*(hiY-loY);
 return{x:[loX-px,hiX+px],y:[loY-py,hiY+py]};
}
