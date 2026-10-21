// ROBOT5 preparation: planar position kinematics and explicit numerical solves.
// No joint limits, collisions or pose-orientation constraints are imposed here.
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const finite=a=>a.every(Number.isFinite);
const validateArm=(q,L)=>{if(!q.length||q.length!==L.length||!finite(q)||!finite(L)||L.some(x=>x<=0))throw new RangeError('finite angles and positive matching link lengths required');};
export function planarForward(q,L){validateArm(q,L);let a=0,x=0,y=0;const points=[[0,0]],angles=[];for(let i=0;i<q.length;i++){a+=q[i];angles.push(a);x+=L[i]*Math.cos(a);y+=L[i]*Math.sin(a);points.push([x,y]);}return{points,angles,end:[x,y]};}
export function planarJacobian(q,L){const {angles}=planarForward(q,L),J=[Array(q.length),Array(q.length)];let x=0,y=0;for(let i=q.length-1;i>=0;i--){x+=L[i]*Math.cos(angles[i]);y+=L[i]*Math.sin(angles[i]);J[0][i]=-y;J[1][i]=x;}return J;}
export function analytic2R(target,L){
 if(target.length!==2||L.length!==2||!finite(target)||!finite(L)||L.some(x=>x<=0))throw new RangeError('finite target and two positive lengths required');
 const [x,y]=target,[a,b]=L,r=Math.hypot(x,y),lo=Math.abs(a-b),hi=a+b;
 if(r<lo||r>hi)return{status:'unreachable',solutions:[],radius:r,workspace:[lo,hi]};
 if(r===0&&a===b)return{status:'continuum',solutions:[[0,Math.PI]],radius:r,workspace:[lo,hi]};
 // Factor the triangle area before taking products: small positive r survives
 // even when r*r underflows, and near-boundary height avoids 1-c*c cancellation.
 const sin2=Math.sqrt(hi-r)*Math.sqrt(hi+r)*(Math.sqrt(r-lo)*Math.sqrt(r+lo))/(2*a*b);
 const cos2=Math.max(-1,Math.min(1,(r*r-a*a-b*b)/(2*a*b))),angle=Math.atan2(sin2,cos2);
 const signs=sin2===0?[1]:[1,-1];
 const solutions=signs.map(sign=>{const q2=sign*angle,q1=Math.atan2(y,x)-Math.atan2(sign*b*sin2,a+b*cos2);return[q1,q2];});
 return{status:sin2===0?'boundary':'two',solutions,radius:r,workspace:[lo,hi]};
}
/** Solve a 2-by-n velocity problem. rtol declares the numerical singular cutoff.
 * With damping>0 this is regularized least squares, not an exact inverse. */
export function velocitySolve(J,v,{damping=0,rtol=1e-12}={}){
 if(J.length!==2||!J[0].length||J[0].length!==J[1].length||!J.every(finite)||v.length!==2||!finite(v)||!Number.isFinite(damping)||damping<0||!(rtol>=0&&rtol<1))throw new RangeError('finite 2-by-n system and nonnegative damping required');
 const norms=J.map(row=>Math.hypot(...row)),first=norms[1]>norms[0]?1:0,second=1-first,nx=norms[first],n=J[0].length;
 const u=nx>0?J[first].map(x=>x/nx):Array(n).fill(0);let b=dot(u,J[second]),z=J[second].map((x,i)=>x-b*u[i]);
 // Pivoted, reorthogonalized QR of J^T supplies right-space vectors directly.
 // Returning J^T times a normal-equation solution loses accuracy near a fold.
 for(let k=0;k<2;k++){const correction=dot(u,z);b+=correction;z=z.map((x,i)=>x-correction*u[i]);}
 const sy=Math.hypot(...z),w=sy>0?z.map(x=>x/sy):Array(n).fill(0),angle=.5*Math.atan2(2*b*sy,nx*nx+b*b-sy*sy),c=Math.cos(angle),s=Math.sin(angle),sigma1=Math.hypot(nx*c,b*c+sy*s),sigma2=sigma1>0?nx*sy/sigma1:0;
 const singularValues=[sigma1,sigma2],rank=singularValues.filter(x=>x>rtol*sigma1).length,permuted=[v[first],v[second]];let qdot=Array(n).fill(0);
 if(damping===0&&rank===2&&n===2){const [[a,b],[c,d]]=J,det=a*d-b*c;qdot=[(v[0]*d-b*v[1])/det,(a*v[1]-v[0]*c)/det];}
 else if(sigma1>0){
  const left1=[nx*c/sigma1,(b*c+sy*s)/sigma1],left2=[-left1[1],left1[0]],right=[u.map((x,i)=>c*x+s*w[i]),u.map((x,i)=>-s*x+c*w[i])];
  for(let k=0;k<2;k++){const sigma=singularValues[k];if(damping===0&&sigma<=rtol*sigma1)continue;let gain;if(damping===0)gain=1/sigma;else{const scale=Math.max(sigma,damping),a=sigma/scale,b=damping/scale;gain=a/(scale*(a*a+b*b));}const coefficient=dot(k===0?left1:left2,permuted)*gain;qdot=qdot.map((x,i)=>x+coefficient*right[k][i]);}
 }
 const achieved=J.map(row=>dot(row,qdot));return{qdot,achieved,residual:Math.hypot(achieved[0]-v[0],achieved[1]-v[1]),norm:Math.hypot(...qdot),singularValues,rank,rtol,damping};
}
export function resolvedRate(q,L,v,z=null,options={}){const J=planarJacobian(q,L),base=velocitySolve(J,v,options);if(!z)return{...base,J,nullVelocity:Array(q.length).fill(0)};if(z.length!==q.length||!finite(z))throw new RangeError('finite null-space proposal required');const Jz=J.map(row=>dot(row,z)),projected=velocitySolve(J,Jz,{rtol:options.rtol??1e-12}),nullVelocity=z.map((x,i)=>x-projected.qdot[i]),qdot=base.qdot.map((x,i)=>x+nullVelocity[i]),achieved=J.map(row=>dot(row,qdot));return{...base,J,nullVelocity,qdot,achieved,residual:Math.hypot(achieved[0]-v[0],achieved[1]-v[1]),norm:Math.hypot(...qdot)};}
export function ikTrace(initial,L,target,{steps=20,method='newton',gain=1,damping=.1,tolerance=1e-8,maxStep=null}={}){
 validateArm(initial,L);if(target.length!==2||!finite(target)||!Number.isInteger(steps)||steps<0||!['newton','transpose','damped'].includes(method)||!Number.isFinite(gain)||gain<=0||!(tolerance>=0))throw new RangeError('valid finite IK controls required');
 let q=[...initial];const rows=[];let status='iteration limit';
 const sample=()=>{const model=planarForward(q,L),error=target.map((x,i)=>x-model.end[i]);return{q:[...q],...model,error,errorNorm:Math.hypot(...error)};};
 for(let k=0;k<=steps;k++){const row=sample();rows.push(row);if(row.errorNorm<=tolerance){status='converged';break;}if(k===steps)break;const J=planarJacobian(q,L);let delta;
  if(method==='transpose')delta=J[0].map((_,i)=>gain*(J[0][i]*row.error[0]+J[1][i]*row.error[1]));
  else{const solve=velocitySolve(J,row.error,{damping:method==='damped'?damping:0});if(method==='newton'&&solve.rank<2){status='numerically singular';break;}delta=solve.qdot.map(x=>gain*x);}
  const norm=Math.hypot(...delta);if(maxStep!==null){if(!(maxStep>0&&Number.isFinite(maxStep)))throw new RangeError('positive finite step cap required');if(norm>maxStep)delta=delta.map(x=>x*maxStep/norm);}
  q=q.map((x,i)=>x+delta[i]);if(!finite(q)){status='nonfinite iterate';break;}
 }
 return{rows,status,target:[...target],method,tolerance};
}
/** One CCD sweep rotates one unrestricted planar joint at a time. */
export function ccdTrace(initial,L,target,{sweeps=20,tolerance=1e-8}={}){
 validateArm(initial,L);if(target.length!==2||!finite(target)||!Number.isInteger(sweeps)||sweeps<0||!(tolerance>=0))throw new RangeError('valid finite CCD controls required');
 let q=[...initial];const rows=[];const sample=joint=>{const f=planarForward(q,L);return{q:[...q],...f,errorNorm:Math.hypot(f.end[0]-target[0],f.end[1]-target[1]),joint};};rows.push(sample(null));
 for(let sweep=0;sweep<sweeps&&rows.at(-1).errorNorm>tolerance;sweep++)for(let j=q.length-1;j>=0;j--){const f=planarForward(q,L),p=f.points[j],u=f.end.map((x,i)=>x-p[i]),w=target.map((x,i)=>x-p[i]);const nu=Math.hypot(...u),nw=Math.hypot(...w);if(nu>0&&nw>0){const U=u.map(x=>x/nu),W=w.map(x=>x/nw);q[j]+=Math.atan2(U[0]*W[1]-U[1]*W[0],dot(U,W));}rows.push(sample(j));if(rows.at(-1).errorNorm<=tolerance)break;}
 return{rows,status:rows.at(-1).errorNorm<=tolerance?'converged':'iteration limit',target:[...target],tolerance};
}
/** FABRIK Algorithm1 (Aristidou--Lasenby2011, printed245), with a declared
 * deterministic previous-link direction when a normalization vector is zero.
 * The radius test also recognizes the general chain's possible inner hole. */
export function fabrikTrace(initial,L,target,{sweeps=20,tolerance=1e-8}={}){
 validateArm(initial,L);if(target.length!==2||!finite(target)||!Number.isInteger(sweeps)||sweeps<0||!(tolerance>=0))throw new RangeError('valid finite FABRIK controls required');
 const original=planarForward(initial,L),base=original.points[0],total=L.reduce((s,x)=>s+x,0),inner=Math.max(0,2*Math.max(...L)-total),distance=Math.hypot(...target.map((x,i)=>x-base[i]));let points=original.points.map(p=>[...p]),fallbacks=0;
 const rows=[],sample=phase=>{const end=points.at(-1);return{points:points.map(p=>[...p]),end:[...end],errorNorm:Math.hypot(end[0]-target[0],end[1]-target[1]),phase};};rows.push(sample('initial'));
 if(distance<inner)return{rows,status:'unreachable inner hole',target:[...target],workspace:[inner,total],fallbacks,tolerance};
 if(distance>total){let length=0;points=[base,...L.map(Li=>{length+=Li;return base.map((x,i)=>x+length*(target[i]-base[i])/distance);})];rows.push(sample('stretched'));return{rows,status:'unreachable outer radius',target:[...target],workspace:[inner,total],fallbacks,tolerance};}
 const unit=(d,fallback)=>{const n=Math.hypot(...d);if(n>0)return d.map(x=>x/n);fallbacks++;return fallback;};
 for(let sweep=0;sweep<sweeps&&rows.at(-1).errorNorm>tolerance;sweep++){
  const directions=L.map((_,i)=>unit(points[i+1].map((x,j)=>x-points[i][j]),[Math.cos(original.angles[i]),Math.sin(original.angles[i])]));
  points[points.length-1]=[...target];for(let i=L.length-1;i>=0;i--){const d=unit(points[i].map((x,j)=>x-points[i+1][j]),directions[i].map(x=>-x));points[i]=points[i+1].map((x,j)=>x+L[i]*d[j]);}rows.push(sample('tip fixed'));
  points[0]=[...base];for(let i=0;i<L.length;i++){const d=unit(points[i+1].map((x,j)=>x-points[i][j]),directions[i]);points[i+1]=points[i].map((x,j)=>x+L[i]*d[j]);}rows.push(sample('base fixed'));
 }
 return{rows,status:rows.at(-1).errorNorm<=tolerance?'converged':'iteration limit',target:[...target],workspace:[inner,total],fallbacks,tolerance};
}
const mm3=(A,B)=>A.map(row=>B[0].map((_,j)=>row.reduce((s,x,k)=>s+x*B[k][j],0)));
const tr3=A=>A[0].map((_,j)=>A.map(row=>row[j]));
export const rotationZ=t=>[[Math.cos(t),-Math.sin(t),0],[Math.sin(t),Math.cos(t),0],[0,0,1]];
export const rotationY=t=>[[Math.cos(t),0,Math.sin(t)],[0,1,0],[-Math.sin(t),0,Math.cos(t)]];
export const wristRotation=q=>mm3(mm3(rotationZ(q[0]),rotationY(q[1])),rotationZ(q[2]));
/** Deliberate special 6R geometry: yaw, two pitch links, and a ZYZ spherical
 * wrist at the tool origin. Its generic count is eight, not the general16 bound. */
export function sphericalForward(q,L=[1,.8]){
 if(q.length!==6||!finite(q)||L.length!==2||!finite(L)||L.some(x=>x<=0))throw new RangeError('six finite joints and two positive lengths required');
 const a=q[1],b=q[1]+q[2],c=Math.cos(q[0]),s=Math.sin(q[0]),radial=L[0]*Math.cos(a)+L[1]*Math.cos(b),height=L[0]*Math.sin(a)+L[1]*Math.sin(b),elbow=[L[0]*Math.cos(a)*c,L[0]*Math.cos(a)*s,L[0]*Math.sin(a)],end=[radial*c,radial*s,height],R03=mm3(rotationZ(q[0]),rotationY(-b)),rotation=mm3(R03,wristRotation(q.slice(3)));
 return{end,rotation,R03,points:[[0,0,0],elbow,end]};
}
export function sphericalInverse(target,R,L=[1,.8],singularTolerance=1e-12){
 if(target.length!==3||!finite(target)||R.length!==3||R.some(row=>row.length!==3||!finite(row))||!(singularTolerance>=0))throw new RangeError('finite pose required');
 const [x,y,z]=target,rho=Math.hypot(x,y),yaw=Math.atan2(y,x),solutions=[];let singular=false;
 for(const sign of(rho===0?[1]:[1,-1])){
  const q1=yaw+(sign===-1?Math.PI:0),arm=analytic2R([sign*rho,z],L);if(arm.status==='unreachable')continue;if(arm.status==='continuum'||rho===0)singular=true;
  for(const [q2,q3] of arm.solutions){const R03=mm3(rotationZ(q1),rotationY(-(q2+q3))),W=mm3(tr3(R03),R),sinBeta=Math.hypot(W[0][2],W[1][2]);let wrists;
   if(sinBeta<=singularTolerance){singular=true;wrists=[[Math.atan2((W[2][2]>=0?1:-1)*W[1][0],(W[2][2]>=0?1:-1)*W[0][0]),W[2][2]>=0?0:Math.PI,0]];}
   else{const alpha=Math.atan2(W[1][2],W[0][2]),beta=Math.atan2(sinBeta,W[2][2]),gamma=Math.atan2(W[2][1],-W[2][0]);wrists=[[alpha,beta,gamma],[alpha+Math.PI,-beta,gamma+Math.PI]];}
   for(const wrist of wrists){const q=[q1,q2,q3,...wrist],actual=sphericalForward(q,L);solutions.push({q,points:actual.points,positionResidual:Math.hypot(...target.map((t,i)=>t-actual.end[i])),rotationResidual:Math.max(...R.flatMap((row,i)=>row.map((r,j)=>Math.abs(r-actual.rotation[i][j]))))});}
  }
 }
 return{solutions,status:!solutions.length?'unreachable':singular?'singular representatives':'isolated branches',singularTolerance};
}
