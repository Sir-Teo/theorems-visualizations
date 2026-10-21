// New private adapters only; every replacement requires one exact source match.
const replace=(s,a,b)=>{if(s.split(a).length!==2||s.includes(b))throw Error('curve source seam is missing, duplicate or applied');return s.replace(a,()=>b);};
export function curveCurrentSources(base){
 let edges=base.variants.chunk.get('assets/js/map-scene-edges.js').toString(),scene=base.variants.chunk.get('assets/js/map-webgl-scene.js').toString(),observer=base.support.get('scripts/lib/map-paired-resource-observer.mjs').toString();
 const edits=[];const edit=(kind,before,after)=>{edits.push({kind,before,after});if(kind==='edges')edges=replace(edges,before,after);else if(kind==='scene')scene=replace(scene,before,after);else observer=replace(observer,before,after);};
 edit('edges',"import {chunkedEdgesClass} from '/scripts/lib/map-chunked-indices-runtime.mjs';","import {curveBoundsEdgesClass} from '/scripts/lib/map-curve-bounds-runtime.mjs';");
 // The curve factory already wraps chunkedEdgesClass internally. Never double-wrap.
 edit('edges','export const SceneEdges=chunkedEdgesClass(OriginalSceneEdges);','export const SceneEdges=curveBoundsEdgesClass(OriginalSceneEdges);');
 edit('scene','const r=this._resourcesOriginal(), e=this.edges, o=e?.optionalResources?.()||{metadataCPU:0,scratchCPU:0,scratchGPU:0,bookkeeping:0};\n    Object.assign(r.components,{optionalPackedXY:o.metadataCPU,optionalScratchCPU:o.scratchCPU,optionalScratchGPU:o.scratchGPU,optionalBookkeeping:o.bookkeeping});r.componentSum+=o.metadataCPU+o.scratchCPU+o.scratchGPU+o.bookkeeping;r.optional=o;return r;',
 'const r=this._resourcesOriginal(),o=this.edges.optionalResources(),c=curveComponents(o);\n    Object.assign(r.components,c.components);r.componentSum+=c.bytes;r.optional=o;return r;');
 edit('observer',"const kind=Object.hasOwn(owner,'model')&&Object.hasOwn(owner,'xy')?'packed-xy-and-bookkeeping':owner.capacity===32768&&Object.hasOwn(owner,'cpu')&&Object.hasOwn(owner,'buffer')?'fixed-cpu-gpu-scratch':null;",'const kind=classifyCurveOptional(owner,bytes);');
 for(const kind of ['edges','scene','observer']){let restored={edges,scene,observer}[kind];for(const e of edits.filter(e=>e.kind===kind).reverse())restored=replace(restored,e.after,e.before);const original=kind==='edges'?base.variants.chunk.get('assets/js/map-scene-edges.js').toString():kind==='scene'?base.variants.chunk.get('assets/js/map-webgl-scene.js').toString():base.support.get('scripts/lib/map-paired-resource-observer.mjs').toString();if(restored!==original)throw Error('complete curve source reconstruction '+kind);}
 scene="import{curveComponents}from'/scripts/lib/map-curve-current-accounting.mjs';\n"+scene;observer="import{classifyCurveOptional}from'./map-curve-current-accounting.mjs';\n"+observer;
 return{edges,scene,observer,edits};
}
