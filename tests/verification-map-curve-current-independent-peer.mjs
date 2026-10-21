// Explicit offline peer supplement. No browser, server, full flag or timing.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const [root,out]=process.argv.slice(2);assert.equal(process.argv.length,4);
await fs.mkdir(out,{recursive:true});assert.deepEqual(await fs.readdir(out),[]);
const load=p=>import(pathToFileURL(path.join(root,p)));const e={browser:false,server:false,fullFlag:false};
try {
 const {curveCurrentFixture}=await load('scripts/lib/map-curve-current-fixture.mjs');const f=await curveCurrentFixture();
 const base='d7d07ed84da592a04c8c038ffc405d5b5607bfc0';
 const rows=execFileSync('git',['ls-tree','-rz','--full-tree',base],{encoding:'utf8'}).split('\0').filter(Boolean);let baseCount=0;
 for(const row of rows){const [desc,p]=row.split('\t'),oid=desc.split(' ')[2];const b=await fs.readFile(path.join(root,p));assert.equal(createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex'),oid,p);baseCount++;}
 e.baseUnchanged=baseCount;assert.equal(baseCount,4800);
 const modules=path.join(out,'served');await fs.mkdir(modules);
 for(const [p,b] of f.variants.chunk)if(p.startsWith('scripts/lib/')&&p.endsWith('.mjs'))await fs.writeFile(path.join(modules,path.basename(p)),b);
 const observer=await import(pathToFileURL(path.join(modules,'map-paired-resource-observer.mjs')));
 const atlas=await import(pathToFileURL(path.join(modules,'map-paired-atlas-observer.mjs')));
 const {curveComponents,requireCurveSubmissions}=await load('scripts/lib/map-curve-current-accounting.mjs');
 const {SceneBudget}=await load('assets/js/map-scene-gl.js'),{SceneEdges}=await load('assets/js/map-scene-edges.js'),{buildWorldPaths}=await load('assets/js/map-scene-model.js'),{RecordingGL}=await load('tests/verification-map-optional-recording-gl.mjs'),{curveBoundsEdgesClass}=await load('scripts/lib/map-curve-bounds-runtime.mjs');
 const gl=new RecordingGL,budget=new SceneBudget(64000000);observer.observeBudget(budget);const reserve=budget.reserve;observer.observeBudget(budget);assert.equal(budget.reserve,reserve);
 const edge=new (curveBoundsEdgesClass(SceneEdges))(gl,budget);const O=atlas.observedSceneClass(class {constructor(){this.edges=edge;}initialize(){return 73;}});const observed=new O;assert.equal(observed.initialize(),73);const wrapped=edge.reserveOptional;observed.initialize();assert.equal(edge.reserveOptional,wrapped);
 const paths=[[[0,0],[20,0],[-20,100],[0,100]],[[9000,0],[9010,0],[9020,0]]];const model=edge.upload(buildWorldPaths(paths,4,{textureWidth:8,includeInstances:false}),paths),ids=[1,0,0,1],indices=[];for(const id of ids)for(let i=0;i<model.ranges[id].segments;i++)indices.push(model.ranges[id].startPoint+i);
 const coverage=[-1048576,-1048576,1048576,1048576];edge.__construction={model,paths,ids,key:'gray',coverage};const group=edge.group(new Uint32Array(indices),{width:2,color:[.2,.5,.9,.5],cap:'round',bounds:coverage});edge.__construction=null;group.model=model;group.coverage=coverage;
 const view={width:128,height:96,dpr:1,k:1,tx:0,ty:0},scene={gl,budget,limit:64000000,canvas:{width:128,height:96},map:{...view,W:128,H:96,canvas:{width:128,height:96}},paths,groups:new Map([['4:gray',group]]),models:new Map([['edges:4',model]]),visibleEdges:ids,generation:7,controlKey:'peer-fixed',edges:edge};edge.scene=scene;
 const before=structuredClone(edge.stats);edge.union(model,[group],view);requireCurveSubmissions({label:'A0',before:{stats:before},after:{stats:edge.stats}});
 const s=f.variants.chunk.get('assets/js/map-webgl-scene.js').toString(),start=s.indexOf('  resources() {'),end=s.indexOf('\n  disposeResources()',start);assert.ok(start>=0&&end>start);
 const methods=new Function('curveComponents','return ({'+s.slice(start,end).replace('\n  _resourcesOriginal()',',\n  _resourcesOriginal()')+'})')(curveComponents);scene._resourcesOriginal=methods._resourcesOriginal;const r=methods.resources.call(scene),ledger=observer.resourceSnapshot(scene);
 assert.equal(r.componentSum,budget.bytes);assert.equal(r.componentSum,ledger.originalBytes+ledger.optionalBytes);assert.equal(edge.meta.bounds.buffer,edge.meta.storage);assert.equal(edge.meta.mapping.buffer,edge.meta.storage);assert.equal(edge.meta.mapping.byteOffset,16*paths.length);assert.equal(edge.meta.storage.byteLength,24*paths.length);assert.equal(edge.meta.xy,undefined);assert.deepEqual(ledger.optional.map(o=>o.kind).sort(),['curve-bounds-and-mapping','fixed-cpu-gpu-scratch']);
 e.actualResources={components:r.components,total:r.componentSum,ledger,stats:edge.stats};edge.destroy();budget.clear();assert.equal(budget.bytes,0);e.cleaned=0;
 const recipe=JSON.parse(await fs.readFile(path.join(root,'tests/map-curve-current-reconstruction.json')));const tail=recipe.exceptions.at(-1).after;const block=tail.slice(tail.indexOf("if(variant==='chunk')"),-1);const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const gate=new AsyncFunction('variant','meta','results','fsp','path','out','assert','requireCurveSubmissions',block);
 const stats={optimizedTiles:100,chunks:100,indices:1000,liveReplays:3,staleAborts:2};const good=()=>['A0','A1','A2','A3'].map(label=>({label,before:{stats:{...stats}},after:{stats:{...stats,optimizedTiles:101,chunks:101,indices:1002}}}));const cases=[];
 for(const name of ['pass','last-fallback','replay','stale','missing','duplicate','original']){const frames=good();if(name==='last-fallback')frames[3].after.stats={...stats};if(name==='replay')frames[2].after.stats.liveReplays++;if(name==='stale')frames[1].after.stats.staleAborts++;if(name==='missing')frames.pop();if(name==='duplicate')frames[3].label='A2';let writes=0,seen=[],failure=null;try{await gate(name==='original'?'original':'chunk',{frames},{variants:{chunk:{}}},{writeFile:async()=>{writes++;}},path,out,assert,x=>{seen.push(x.label);return requireCurveSubmissions(x);});}catch(error){failure=error.message;}const pass=['pass','original'].includes(name);assert.equal(!failure,pass);assert.equal(writes,name==='original'?0:1);if(name==='pass')assert.deepEqual(seen,['A0','A1','A2','A3']);if(name==='original')assert.deepEqual(seen,[]);cases.push({name,seen,writes,failure});}
 e.gateLoop=cases;e.pass=true;await fs.writeFile(path.join(out,'independent.json'),JSON.stringify(e,null,2)+'\n');console.log('PASS independent original-byte, actual shared-ledger resources and per-A gate-loop models');
}catch(error){e.failure={message:error.message,stack:error.stack};await fs.writeFile(path.join(out,'independent.json'),JSON.stringify(e,null,2)+'\n');throw error;}
