/** Classical spectral scaling, following Williams NIPS2000/2001 §2.1.
 * Symmetric finite nonnegative dissimilarities, zero diagonal. This routine
 * does not optimize raw-distance stress or fit a nonmetric transformation.
 */
import { eigSym } from '../../assets/js/viz/math.js';
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const norm2=(a,b)=>a.reduce((s,x,j)=>s+(x-b[j])**2,0);
export function mdsDistances(X) {
  if(!Array.isArray(X)||X.length<2||X.some(x=>!Array.isArray(x)||x.length!==2||x.some(v=>!Number.isFinite(v))))throw new RangeError('At least two finite planar points required');
  return X.map(x=>X.map(y=>Math.sqrt(norm2(x,y))));
}
export function mdsGram(D) {
  const n=D?.length;
  if(!Array.isArray(D)||n<2||D.some((r,i)=>!Array.isArray(r)||r.length!==n||r.some((x,j)=>!Number.isFinite(x)||x<0||(i===j&&x!==0)||x!==D[j]?.[i])))throw new RangeError('Symmetric nonnegative finite dissimilarities with zero diagonal required');
  const squared=D.map(r=>r.map(x=>x*x)),rows=squared.map(mean),grand=mean(rows);
  if(squared.some(r=>r.some(x=>!Number.isFinite(x))))throw new RangeError('Squared dissimilarities exceed the numeric range');
  return squared.map((r,i)=>r.map((x,j)=>-.5*(x-rows[i]-rows[j]+grand)));
}
export function mdsFit(D,maxDimension) {
  const B=mdsGram(D),n=D.length;maxDimension??=Math.min(4,n-1);
  if(!Number.isInteger(maxDimension)||maxDimension<1||maxDimension>=n)throw new RangeError('Embedding dimension must be between1 and n−1');
  const E=eigSym(B),scale=Math.max(...E.values.map(Math.abs)),tolerance=64*Number.EPSILON*n*scale,used=E.values.map(x=>x>tolerance?x:0);
  const coordinate=k=>Array.from({length:n},(_,i)=>Array.from({length:k},(_,j)=>E.vecs[j][i]*Math.sqrt(used[j])));
  let targetSquares=0,pairs=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){targetSquares+=D[i][j]**2;pairs++;}
  const fits=Array.from({length:maxDimension},(_,a)=>{const dimension=a+1,points=coordinate(dimension);let residualSquares=0,gramSquares=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const b=points[i].reduce((s,x,k)=>s+x*points[j][k],0);gramSquares+=(B[i][j]-b)**2;
    if(i<j)residualSquares+=(D[i][j]-Math.sqrt(norm2(points[i],points[j])))**2;
  }return{dimension,points,residualSquares,absoluteRms:Math.sqrt(residualSquares/pairs),normalized:targetSquares?Math.sqrt(residualSquares/targetSquares):null,gramError:Math.sqrt(gramSquares)};});
  return{D,B,eigenvalues:E.values,eigenvectors:E.vecs,used,tolerance,positive:E.values.filter(x=>x>tolerance).length,negative:E.values.filter(x=>x< -tolerance).length,nearZero:E.values.filter(x=>Math.abs(x)<=tolerance).length,targetSquares,targetRms:Math.sqrt(targetSquares/pairs),pairs,fits};
}
/** Closed-form2D orthogonal Procrustes alignment: translation, rotations and
 * reflection only. No fitted scale: supplied distance units are preserved.
 */
export function mdsRigid(truth,recovered) {
  if(truth.length!==recovered.length)throw new RangeError('Matching planar configurations required');
  mdsDistances(truth);mdsDistances(recovered);
  const center=X=>{const shifted=X.map(x=>[x[0]-X[0][0],x[1]-X[0][1]]),mu=[mean(shifted.map(x=>x[0])),mean(shifted.map(x=>x[1]))];return shifted.map(x=>[x[0]-mu[0],x[1]-mu[1]]);},X=center(truth),Y=center(recovered);let best=null;
  for(const reflection of[1,-1]){const W=Y.map(p=>[p[0],reflection*p[1]]);let a=0,b=0;for(let i=0;i<X.length;i++){a+=X[i][0]*W[i][0]+X[i][1]*W[i][1];b+=W[i][0]*X[i][1]-W[i][1]*X[i][0];}const theta=Math.atan2(b,a),c=Math.cos(theta),s=Math.sin(theta),points=W.map(p=>[c*p[0]-s*p[1],s*p[0]+c*p[1]]),squared=points.reduce((z,p,i)=>z+norm2(p,X[i]),0),rms=Math.sqrt(squared/X.length);if(!best||rms<best.rms)best={points,rms,theta,reflection};}
  const radius=Math.sqrt(mean(X.map(p=>p[0]**2+p[1]**2)));return{...best,truth:X,radius,relative:radius?best.rms/radius:null,scale:1};
}
export function mdsSynthetic(X,sd,Z,maxDimension) {
  const truthDistances=mdsDistances(X),n=X.length;
  if(!Number.isFinite(sd)||sd<0||!Array.isArray(Z)||Z.length!==n||Z.some((r,i)=>!Array.isArray(r)||r.length!==n||r.some((x,j)=>!Number.isFinite(x)||x!==Z[j]?.[i]||(i===j&&x!==0))))throw new RangeError('Nonnegative log noise and a finite symmetric zero-diagonal noise table required');
  const D=truthDistances.map((r,i)=>r.map((x,j)=>i===j?0:x*Math.exp(sd*Z[i][j]))),fit=mdsFit(D,maxDimension),two=fit.fits[Math.min(1,fit.fits.length-1)].points.map(p=>[p[0],p[1]??0]),aligned=mdsRigid(X,two);
  return{...fit,truthDistances,sd,truth:X.map(p=>[...p]),alignment:aligned};
}
export function mdsView(points) {
  if(!points.length||points.some(p=>p.length!==2||p.some(x=>!Number.isFinite(x))))throw new RangeError('Finite plot coordinates required');
  const extent=Math.max(1,...points.flat().map(Math.abs))*1.32;
  return{x:[-extent,extent],y:[-extent,extent]};
}
