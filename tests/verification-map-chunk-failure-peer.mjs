// Explicit read-only evidence/provenance audit; never starts a browser or timing run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.argv[2];assert.ok(root,'Pass exact acf697e archive path');
const read=p=>fs.readFileSync(path.join(root,p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=JSON.parse(read('docs/verification/map-chunked-indices-matrix.json'));
assert.equal(hash(read('docs/verification/map-chunked-indices-matrix.json')),hash(fs.readFileSync('/tmp/atlas-map-chunked-matrix/native.json')));
for(const[p,h]of Object.entries(raw.hashes)){
 const disk=p.startsWith('data/')||p.startsWith('assets/')?path.join('/tmp/atlas-continuation/checkpoint5',p):path.join(root,p);
 assert.equal(hash(fs.readFileSync(disk)),h,p);
}
const {chunkedSceneSources}=await import(pathToFileURL(path.join(root,'scripts/lib/map-chunked-indices-prototype.mjs')));
const edges=read('assets/js/map-scene-edges.js').toString(),scene=read('assets/js/map-webgl-scene.js').toString(),adapted=chunkedSceneSources(edges,scene);
assert.ok(adapted.edges.includes(edges.replace('export class SceneEdges','class OriginalSceneEdges')));
assert.ok(adapted.scene.includes('this.edges.__construction={model,key,ids,paths,coverage}'));
assert.equal(raw.complete,false);assert.equal(raw.results.length,33);
assert.ok(raw.results.slice(0,-1).every(r=>r.sameScene.changed===0));
const r=raw.results.at(-1);assert.deepEqual([r.width,r.height,r.dpr,r.theme,r.name,r.k,r.dx,r.dy,r.moving],[3840,2160,2,'light','fractional-pan',.8,12.375,-8.125,true]);
assert.deepEqual(r.sameScene,{changed:31327,max:121,width:7680,height:4184});
assert.deepEqual([r.deltaChunks,r.deltaOptimized,r.glError],[70,117,0]);
for(const row of raw.results){const res=row.resources;assert.equal(Object.values(res.components).reduce((a,b)=>a+b,0),res.componentSum);assert.equal(res.componentSum,res.logicalRetainedBytes);assert.ok(res.logicalRetainedBytes<=64000000&&res.logicalPeakBytes<=64000000);assert.ok(res.maskPixels<=8000000);assert.equal(res.primarySamples,0);assert.equal(res.inputCanvasPixels,1);}
assert.equal(r.resources.components.optionalPackedXY,1161473*8);
assert.equal(r.resources.components.optionalScratchCPU+r.resources.components.optionalScratchGPU,32768*8);
assert.deepEqual([r.resources.logicalRetainedBytes,r.resources.logicalPeakBytes],[62471764,63895600]);
assert.equal(raw.results.at(-3).deltaOptimized,0,'unselected oversized is an original-path case');
assert.equal(raw.results.at(-2).deltaOptimized,13);
assert.ok(raw.results.every(row=>row.theme==='light'),'no dark/lifecycle acceptance');
const evidence=JSON.parse(read('docs/verification/map-chunked-indices-evidence.json'));
for(const name of['3840-2-light-fractional-pan-actual.png','3840-2-light-fractional-pan-direct.png'])assert.equal(hash(fs.readFileSync(path.join('/tmp/atlas-map-chunked-matrix',name))),evidence.stages.matrix.PNGs[name]);
console.log(JSON.stringify({archive:root,checks:'33 raw states, exact hashes, complete original edge-class retention, resource reconciliation, stopped failure and image provenance',failure:r.sameScene,logical:r.resources.logicalRetainedBytes,peak:r.resources.logicalPeakBytes,unrun:'dark and later lifecycle',nativeRerun:false},null,2));
