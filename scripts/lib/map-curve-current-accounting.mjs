// Private curve-case accounting. No allocation, rendering, reserve or eviction policy.
export const CURVE_KIND='curve-bounds-and-mapping',SCRATCH_KIND='fixed-cpu-gpu-scratch';
const require=(yes,why)=>{if(!yes)throw Error('curve accounting: '+why);};
export function classifyCurveOptional(owner,bytes){
 if(owner?.kind===CURVE_KIND){
  const keys=['kind','model','paths','ranges','pathCount','pointCount','segmentCount','storage','bounds','mapping','J','maxAbs'];
  require(Object.keys(owner).length===keys.length&&keys.every(k=>Object.hasOwn(owner,k)),'metadata owner shape');
  require(owner.model&&owner.model.scale===4&&Array.isArray(owner.paths)&&Array.isArray(owner.ranges)&&owner.paths.length===owner.pathCount&&owner.ranges.length===owner.pathCount,'metadata association');
  require(Number.isSafeInteger(owner.pathCount)&&owner.pathCount>=0&&Number.isSafeInteger(owner.pathCount*24+4096)&&bytes===owner.pathCount*24+4096,'metadata reservation bytes');
  require(owner.ranges===owner.model.ranges&&owner.pointCount===owner.model.pointCount&&owner.segmentCount===owner.model.segmentCount&&Number.isSafeInteger(owner.pointCount)&&owner.pointCount>=0&&Number.isSafeInteger(owner.segmentCount)&&owner.segmentCount>=0&&Number.isFinite(owner.J)&&owner.J>=0&&owner.J<=16&&Number.isFinite(owner.maxAbs)&&owner.maxAbs>=0&&owner.maxAbs<=2**20,'metadata model/count/envelope');
  require(owner.storage===null&&owner.bounds===null&&owner.mapping===null,'reserve must precede metadata allocation');
  return CURVE_KIND;
 }
 if(owner?.capacity===32768){require(Object.keys(owner).sort().join(',')==='buffer,capacity,cpu'&&owner.cpu===null&&owner.buffer===null&&bytes===262144,'scratch reservation shape/bytes');return SCRATCH_KIND;}
 throw Error('curve accounting: unknown optional owner');
}
export function curveComponents(o){
 require(o?.metadataKind===CURVE_KIND,'metadata resource kind');require(Object.keys(o).sort().join(',')==='bookkeeping,capacity,curveBoundsCPU,curveMappingCPU,metadataKind,modelScale,scratchCPU,scratchGPU','resource component shape');
 const keys=['curveBoundsCPU','curveMappingCPU','scratchCPU','scratchGPU','bookkeeping'];for(const k of keys)require(Number.isSafeInteger(o[k])&&o[k]>=0,'component '+k);
 require(o.curveBoundsCPU%16===0&&o.curveMappingCPU*2===o.curveBoundsCPU,'disjoint bounds/mapping views');
 require(o.bookkeeping===0||o.bookkeeping===4096,'bookkeeping size');
 require(o.curveBoundsCPU===0&&o.curveMappingCPU===0||o.bookkeeping===4096,'metadata bookkeeping');
 require(o.capacity===0||o.capacity===32768,'scratch capacity');require(o.scratchCPU===o.scratchGPU&&o.scratchCPU===o.capacity*4,'fixed scratch pair');
 require(o.bookkeeping===0?o.modelScale===null:o.modelScale===4,'active metadata scale');
 const components={optionalCurveBoundsCPU:o.curveBoundsCPU,optionalCurveMappingCPU:o.curveMappingCPU,optionalScratchCPU:o.scratchCPU,optionalScratchGPU:o.scratchGPU,optionalBookkeeping:o.bookkeeping};
 return{components,bytes:Object.values(components).reduce((a,b)=>a+b,0)};
}
export function requireCurveSubmissions(frame){
 const a=frame.after?.stats,b=frame.before?.stats;require(a&&b,'submission snapshots');const delta={};for(const key of ['optimizedTiles','chunks','indices','liveReplays','staleAborts']){require(Number.isSafeInteger(a[key])&&Number.isSafeInteger(b[key])&&a[key]>=b[key],'monotone '+key);delta[key]=a[key]-b[key];}
 require(delta.optimizedTiles>0&&delta.chunks>0&&delta.indices>=delta.chunks&&delta.indices<=delta.chunks*32768,'nonempty submitted chunks in '+frame.label);
 require(delta.liveReplays===0&&delta.staleAborts===0,'clean successful submission in '+frame.label);return delta;
}
