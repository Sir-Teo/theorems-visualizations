// Unwired private source/model proposal: inclusive Float32 range extrema + counted range snapshots.
// No existing runtime, shader, observer, static fixture or full-map runner imports this file.
import {chunkedEdgesClass,CHUNK_CAPACITY,BOOKKEEPING_BYTES} from './map-chunked-indices-runtime.mjs';
import {intersectsTile} from './map-segment-mesh-enclosure.mjs';
import {validateCurveUpload,fillCurveExtrema,curveDomain,curveBox} from './map-curve-bounds-math.mjs';
export {CHUNK_CAPACITY,BOOKKEEPING_BYTES};
export const CURVE_METADATA_BYTES_PER_PATH=24;
export function trustedCurveMapping(meta,model) {
 if(!meta||meta.corrupt||!(meta.storage instanceof ArrayBuffer)||!(meta.bounds instanceof Float32Array)||!(meta.mapping instanceof Uint32Array)||meta.model!==model||meta.ranges!==model.ranges
  ||meta.pathCount!==meta.ranges.length||meta.paths.length!==meta.pathCount||model.pointCount!==meta.pointCount||model.segmentCount!==meta.segmentCount
  ||meta.bounds.length!==meta.pathCount*4||meta.mapping.length!==meta.pathCount*2||model.scale!==4
  ||meta.storage.byteLength!==meta.pathCount*24||meta.bounds.buffer!==meta.storage||meta.mapping.buffer!==meta.storage
  ||meta.bounds.byteOffset!==0||meta.mapping.byteOffset!==meta.pathCount*16)return false;
 let point=0,segment=0;
 for(let id=0;id<meta.pathCount;id++) {
  const r=meta.ranges[id];
  if(!r||r.startPoint!==meta.mapping[id*2]||r.segments!==meta.mapping[id*2+1]||r.startPoint!==point||r.startSegment!==segment
   ||!Number.isSafeInteger(r.segments)||r.segments<0||r.startPoint+r.segments>=meta.pointCount)return false;
  point+=r.segments+1;segment+=r.segments;
 }
 return point===meta.pointCount&&segment===meta.segmentCount;
}
// Count original membership even when a whole range is geometrically culled.
export function visitCurveMembership(d,accept,emit) {
 let count=0;const bundle=d.key.startsWith('bundle:');
 for(const id of d.ids) {
  const p=d.paths[id],a=p[0],b=p.at(-1),c=d.coverage;
  if(!bundle&&(Math.max(a[0],b[0])<c[0]||Math.min(a[0],b[0])>c[2]||Math.max(a[1],b[1])<c[1]||Math.min(a[1],b[1])>c[3]))continue;
  const r=d.model.ranges[id];count+=r.segments;
  if(accept(id,r))for(let i=0;i<r.segments;i++)emit(r.startPoint+i);
 }
 return count;
}
export function curveBoundsEdgesClass(Original) {
 const XY=chunkedEdgesClass(Original);
 return class CurveBoundsEdges extends XY {
  optionalResources() {return {metadataKind:'curve-bounds-and-mapping',curveBoundsCPU:this.meta?.bounds?.byteLength||0,curveMappingCPU:this.meta?.mapping?.byteLength||0,scratchCPU:this.scratch?.cpu?.byteLength||0,scratchGPU:this.scratch?this.scratch.capacity*4:0,bookkeeping:this.meta?BOOKKEEPING_BYTES:0,capacity:this.scratch?.capacity||0,modelScale:this.meta?.model.scale??null};}
  upload(geometry,paths,options) {
   const model=Original.prototype.upload.call(this,geometry,paths,options);if(geometry.scale!==4)return model;
   this.dropOptional('curve metadata replacement');
   const validation=validateCurveUpload(geometry,paths);
   if(!validation){this.event('curve metadata unavailable',{reason:'untrusted upload'});return model;}
   const pathCount=paths.length,bytes=pathCount*CURVE_METADATA_BYTES_PER_PATH+BOOKKEEPING_BYTES;
   const owner={kind:'curve-bounds-and-mapping',model,paths,ranges:model.ranges,pathCount,pointCount:model.pointCount,segmentCount:model.segmentCount,storage:null,bounds:null,mapping:null,J:validation.J,maxAbs:validation.maxAbs};
   if(!this.reserveOptional(owner,bytes,()=>{owner.storage=null;owner.bounds=null;owner.mapping=null;if(this.meta===owner)this.meta=null;})){this.event('curve metadata unavailable',{bytes,reason:'ownership denied'});return model;}
   this.meta=owner;
   try {
    owner.storage=new ArrayBuffer(pathCount*CURVE_METADATA_BYTES_PER_PATH);
    owner.bounds=new Float32Array(owner.storage,0,pathCount*4);
    owner.mapping=new Uint32Array(owner.storage,pathCount*16,pathCount*2);
    fillCurveExtrema(owner.bounds,geometry);
    for(let id=0;id<pathCount;id++){owner.mapping[id*2]=geometry.ranges[id].startPoint;owner.mapping[id*2+1]=geometry.ranges[id].segments;}
    if(!trustedCurveMapping(owner,model))throw Error('untrusted uploaded range association');
    this.stats.metadataCopies++;this.event('curve metadata',{bytes,scale:model.scale,paths:pathCount});
   } catch(error){this.dropOptional(error.message);}
   return model;
  }
  descriptor(model,g) {
   const d=super.descriptor(model,g),meta=this.meta;
   if(!d||!trustedCurveMapping(meta,model)||d.paths!==meta.paths)return null;
   for(const id of d.ids)if(!Number.isSafeInteger(id)||id<0||id>=meta.pathCount)return null;
   return d;
  }
  live(model,g,view,d) {return super.live(model,g,view,d)&&this.budget.entries.has(model)&&this.budget.entries.has(g)&&trustedCurveMapping(this.meta,model)&&this.meta.paths===this.scene?.paths;}
  supported(meta,group,view,tileW,tileH) {return trustedCurveMapping(meta,group.model)&&Number.isFinite(meta.maxAbs)&&meta.maxAbs<=2**20&&Number.isFinite(meta.J)&&meta.J>=0&&meta.J<=16&&curveDomain(group,view,tileW,tileH);}
  box(id,g,v,pw,ph) {return curveBox(this.meta.bounds,id,this.meta.J,g,v,pw,ph);}
  bind(model,g,view,x=0,y=0,tileW=view.width*view.dpr,tileH=view.height*view.dpr,maskOnly=false) {
   const original=()=>{this.stats.originalBinds++;return Original.prototype.bind.call(this,model,g,view,x,y,tileW,tileH,maskOnly);};
   if(!maskOnly||this.forceOriginal)return original();
   if(model.released||!this.budget.entries.has(model)||!g.buffer||!this.budget.entries.has(g)){this.stats.staleAborts++;throw Error('curve snapshot expired: original ownership unavailable');}
   if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||y<0||x>8192||y>8192)return original();
   const d=this.descriptor(model,g),meta=this.meta;
   if(!d||!this.supported(meta,g,view,tileW,tileH)||!this.ensureScratch())return original();
   const gl=this.gl,pw=Math.round(view.width*view.dpr),ph=Math.round(view.height*view.dpr),b=g.bounds,margin=g.width*5+2,l=b?Math.max(0,Math.floor((b[0]*view.k+view.tx-margin)*view.dpr)):0,r=b?Math.min(pw,Math.ceil((b[2]*view.k+view.tx+margin)*view.dpr)):pw,t=b?Math.max(0,Math.floor((b[1]*view.k+view.ty-margin)*view.dpr)):0,bottom=b?Math.min(ph,Math.ceil((b[3]*view.k+view.ty+margin)*view.dpr)):ph,L=Math.max(x,l),R=Math.min(x+tileW,r),T=Math.max(y,t),B=Math.min(y+tileH,bottom),clip={x:L,y:T,width:R-L,height:B-T};let used=0,chunks=0,retained=0;
   const flush=()=>{if(!used)return;if(!this.live(model,g,view,d)||this.meta!==meta)throw Error('expired snapshot');gl.bindBuffer(gl.ARRAY_BUFFER,this.scratch.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.scratch.cpu,0,used);Original.prototype.bind.call(this,model,{...g,buffer:this.scratch.buffer,count:used},view,x,y,tileW,tileH,true);if(gl.getError()!==gl.NO_ERROR)throw Error('chunk GL failure');chunks++;this.stats.chunks++;this.stats.indices+=used;used=0;if(this.fault&&chunks>=this.fault.afterChunks){const fault=this.fault;this.fault=null;if(fault.mode==='stale')this.scene.map.k+=.0001;if(fault.mode==='released'){this.releaseGroup(g);g.buffer=null;}throw Error('injected '+fault.mode);}};
   try {
    const count=visitCurveMembership(d,id=>intersectsTile(this.box(id,g,view,pw,ph),clip),index=>{this.scratch.cpu[used++]=index;retained++;if(used===this.scratch.capacity)flush();});
    if(count!==g.count)throw Error('stream count mismatch');flush();if(!this.live(model,g,view,d)||this.meta!==meta)throw Error('expired snapshot');this.stats.optimizedTiles++;if(!retained)this.stats.emptyTiles++;this.event('tile',{key:d.key,original:g.count,retained,chunks});return;
   } catch(error) {
    if(!this.live(model,g,view,d)||gl.isContextLost()){this.stats.staleAborts++;throw Error('chunk snapshot expired: '+error.message);}
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.mask.framebuffer);gl.viewport(0,0,tileW,tileH);gl.enable(gl.SCISSOR_TEST);gl.scissor(L-x,tileH-(B-y),R-L,B-T);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.blendEquation(gl.MAX);gl.blendFunc(gl.ONE,gl.ONE);this.stats.liveReplays++;return original();
   }
  }
 };
}
