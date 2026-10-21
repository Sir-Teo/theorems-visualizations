// Explicit-only routed sources; production and old scene modules remain untouched.
import assert from 'node:assert/strict';
export function chunkedSceneSources(edges,scene){
 assert.ok(edges.includes('export class SceneEdges'));let E="import {chunkedEdgesClass} from '/scripts/lib/map-chunked-indices-runtime.mjs';\n"+edges.replace('export class SceneEdges','class OriginalSceneEdges');E+='\nexport const SceneEdges=chunkedEdgesClass(OriginalSceneEdges);\n';
 let S=scene.replace('this.edges = new SceneEdges(gl, this.budget);','this.edges = new SceneEdges(gl, this.budget); this.edges.scene=this;');
 const needle='group = this.edges.group(new Uint32Array(indices), { ...style, bounds }); group.model = model;';assert.ok(S.includes(needle));S=S.replace(needle,'this.edges.__construction={model,key,ids,paths,coverage}; try { group = this.edges.group(new Uint32Array(indices), { ...style, bounds }); } finally { this.edges.__construction=null; } group.model = model;');
 S=S.replace('  resources() {','  resources() {\n    const r=this._resourcesOriginal(), e=this.edges, o=e?.optionalResources?.()||{metadataCPU:0,scratchCPU:0,scratchGPU:0,bookkeeping:0};\n    Object.assign(r.components,{optionalPackedXY:o.metadataCPU,optionalScratchCPU:o.scratchCPU,optionalScratchGPU:o.scratchGPU,optionalBookkeeping:o.bookkeeping});r.componentSum+=o.metadataCPU+o.scratchCPU+o.scratchGPU+o.bookkeeping;r.optional=o;return r;\n  }\n  _resourcesOriginal() {');return{edges:E,scene:S};
}
