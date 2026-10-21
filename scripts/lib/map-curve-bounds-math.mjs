// Private source/model proposal only. No renderer or static fixture imports this module.
import {halfInterval,constant,operation} from './map-segment-mesh-enclosure.mjs';
const storage = new DataView(new ArrayBuffer(8));
export function nextUp64(x) {
 if (Number.isNaN(x) || x === Infinity) return x;
 if (x === -Infinity) return -Number.MAX_VALUE;
 if (x === 0) return Number.MIN_VALUE;
 storage.setFloat64(0,x); let bits=storage.getBigUint64(0);
 storage.setBigUint64(0,bits+(x>0?1n:-1n));return storage.getFloat64(0);
}
export const nextDown64=x=>-nextUp64(-x);
export function curveDomain(group,view,tileW,tileH) {
 return [view.k,view.tx,view.ty,view.width,view.height,group.width,tileW,tileH].every(Number.isFinite)
  && view.k>=.01 && view.k<=16 && Math.fround(view.k)>0 && [1,2].includes(view.dpr)
  && Math.abs(view.tx)<=2**20 && Math.abs(view.ty)<=2**20 && view.width>0 && view.height>0
  && Number.isSafeInteger(Math.round(view.width*view.dpr)) && Number.isSafeInteger(Math.round(view.height*view.dpr))
  && Math.round(view.width*view.dpr)>0 && Math.round(view.height*view.dpr)>0
  && view.width*view.dpr<=8192 && view.height*view.dpr<=8192
  && Number.isInteger(tileW) && Number.isInteger(tileH) && tileW>=1 && tileW<=4096 && tileH>=1 && tileH<=4096
  && group.width>=.1 && group.width<=8 && ['round','butt'].includes(group.cap);
}
// Read only the supplied upload. No per-point/per-path staging array is retained.
export function validateCurveUpload(G,paths) {
 if (!(G.points instanceof Float32Array) || !(G.joins instanceof Float32Array) || !Array.isArray(paths) || !Array.isArray(G.ranges)
  || !Number.isSafeInteger(G.pointCount) || G.pointCount<0 || G.pointCount>2**31-1 || !Number.isSafeInteger(G.segmentCount) || G.segmentCount<0
  || !Number.isSafeInteger(G.textureWidth) || G.textureWidth<1 || !Number.isSafeInteger(G.textureHeight) || G.textureHeight<1
  || !Number.isSafeInteger(G.textureWidth*G.textureHeight) || G.points.length!==G.textureWidth*G.textureHeight*4
  || G.joins.length!==G.textureWidth*G.textureHeight*2 || G.pointCount>G.textureWidth*G.textureHeight || G.ranges.length!==paths.length) return null;
 let point=0,segment=0,maxAbs=0,J=0;
 for(let id=0;id<paths.length;id++) {
  const r=G.ranges[id],path=paths[id];
  if(!r || !Array.isArray(path) || !path.length || path.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))
   || !Number.isSafeInteger(r.startPoint) || r.startPoint!==point || !Number.isSafeInteger(r.startSegment) || r.startSegment!==segment
   || !Number.isSafeInteger(r.segments) || r.segments<0 || r.startPoint+r.segments>=G.pointCount
   || !Number.isFinite(r.length) || r.length<0) return null;
  let arc=-Infinity;
  for(let j=0;j<=r.segments;j++) {
   const at=(r.startPoint+j)*4,x=G.points[at],y=G.points[at+1],z=G.points[at+2],w=G.points[at+3],fraction=w-Math.floor(w);
   if(!(Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z)&&Number.isFinite(w))||Math.abs(x)>2**20||Math.abs(y)>2**20||z<arc||z<0||Math.floor(w)!==id
    || (j===0?!(fraction>.2&&fraction<.4):j===r.segments?!(fraction>.4):fraction!==0)
    || (j===0&&z!==0) || (j===r.segments&&z!==Math.fround(r.length))) return null;
   arc=z;maxAbs=Math.max(maxAbs,Math.abs(x),Math.abs(y));
  }
  point+=r.segments+1;segment+=r.segments;
 }
 if(point!==G.pointCount||segment!==G.segmentCount)return null;
 // Match the old global upload envelope, including harmless padded join lanes.
 for(const value of G.joins){const h=halfInterval(value);if(!h)return null;J=Math.max(J,Math.abs(h[0]),Math.abs(h[1]));}
 if(J>16)return null;
 return {J,maxAbs};
}
export function fillCurveExtrema(target,G) {
 if(!(target instanceof Float32Array)||target.length!==G.ranges.length*4)throw Error('bounds allocation shape mismatch');
 for(let id=0;id<G.ranges.length;id++) {
  const r=G.ranges[id];let xmin=Infinity,ymin=Infinity,xmax=-Infinity,ymax=-Infinity;
  for(let j=0;j<=r.segments;j++){const at=(r.startPoint+j)*4;xmin=Math.min(xmin,G.points[at]);ymin=Math.min(ymin,G.points[at+1]);xmax=Math.max(xmax,G.points[at]);ymax=Math.max(ymax,G.points[at+1]);}
  target[id*4]=xmin;target[id*4+1]=ymin;target[id*4+2]=xmax;target[id*4+3]=ymax;
 }
}
export function curveBox(bounds,id,J,g,v,pw,ph) {
 if(!(bounds instanceof Float32Array)||!curveDomain(g,v,1,1)||pw!==Math.round(v.width*v.dpr)||ph!==Math.round(v.height*v.dpr))return null;
 const at=id*4;if(!Number.isSafeInteger(id)||id<0||at+3>=bounds.length||!Number.isFinite(J)||J<0||J>16)return null;
 const xmin=bounds[at],ymin=bounds[at+1],xmax=bounds[at+2],ymax=bounds[at+3];
 if(![xmin,ymin,xmax,ymax].every(Number.isFinite)||xmin>xmax||ymin>ymax||Math.max(Math.abs(xmin),Math.abs(xmax),Math.abs(ymin),Math.abs(ymax))>2**20)return null;
 const k=Math.fround(v.k),tx=Math.fround(v.tx),ty=Math.fround(v.ty),inv=operation(constant(1),constant(v.dpr),'/'),outer=operation(constant(g.width/2),inv,'+');
 if(!outer)return null;
 const extension=g.cap==='round'?outer[1]:inv[1],radius=J*(outer[1]+extension),X=Math.max(Math.abs(xmin*k),Math.abs(xmax*k)),Y=Math.max(Math.abs(ymin*k),Math.abs(ymax*k));
 // Same eight-add association as old endpoint magnitude, with componentwise dominating terms.
 let M=X;M=nextUp64(M+X);M=nextUp64(M+Y);M=nextUp64(M+Y);M=nextUp64(M+Math.abs(tx));M=nextUp64(M+Math.abs(ty));M=nextUp64(M+radius);M=nextUp64(M+(pw+ph)/v.dpr);M=nextUp64(M+1);
 const guard=nextUp64(1+128*2**-23*M*v.dpr);
 const lo=(q,t)=>Math.floor(nextDown64(nextDown64(nextDown64(nextDown64(q*k+t)-radius)*v.dpr)-guard));
 const hi=(q,t)=>Math.ceil(nextUp64(nextUp64(nextUp64(nextUp64(q*k+t)+radius)*v.dpr)+guard));
 const box=[lo(xmin,tx),lo(ymin,ty),hi(xmax,tx),hi(ymax,ty)];return box.every(Number.isFinite)?box:null;
}
