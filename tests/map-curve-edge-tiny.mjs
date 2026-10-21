// Default PREPARE is filesystem/model only. Root-only native RUN requires BOTH exact mode and flag.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {curveEdgeRecipes,curveEdgePaths,curveEdgeOccurrences,CURVE_EDGE_ROOT_FLAG} from '../scripts/lib/map-curve-edge-tiny-recipes.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const ownRoot=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const pins=JSON.parse(fs.readFileSync(path.join(ownRoot,'tests/map-curve-edge-tiny-source-pins.json')));
const html='<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Private curve edge gate</title></head><body></body></html>';
function sourceMap(root){
 const map=new Map;
 for(const [file,expected] of Object.entries(pins.sources)){
  const b=fs.readFileSync(path.join(root,file));assert.equal(hash(b),expected,'exact candidate/original source pin '+file);map.set('/'+file,b);
 }
 for(const file of ['scripts/lib/map-curve-edge-tiny-recipes.mjs','scripts/lib/map-curve-edge-tiny-program.mjs'])map.set('/'+file,fs.readFileSync(path.join(ownRoot,file)));
 map.set('/curve-edge-fixture.html',Buffer.from(html));return map;
}
const controlHashes=()=>Object.fromEntries(['tests/map-curve-edge-tiny.mjs','tests/map-curve-edge-tiny-source-pins.json'].map(p=>[p,hash(fs.readFileSync(path.join(ownRoot,p)))]));
async function prepare(root,out){
 assert.ok(!fs.existsSync(out),'new output directory required');fs.mkdirSync(out,{recursive:true});
 const sources=sourceMap(root),{buildWorldPaths}=await import(pathToFileURL(path.join(root,'assets/js/map-scene-model.js'))),{validateCurveUpload}=await import(pathToFileURL(path.join(root,'scripts/lib/map-curve-bounds-math.mjs')));
 const recipes=curveEdgeRecipes(),preflight=[];
 for(const spec of recipes){
  const paths=curveEdgePaths(spec.geometry),G=buildWorldPaths(paths,4,{textureWidth:8,includeInstances:false}),occurrence=curveEdgeOccurrences(spec);
  const facts={id:spec.id,points:G.pointCount,segments:G.segmentCount,ranges:G.ranges,paths:paths.length,pointsSHA256:hash(Buffer.from(G.points.buffer)),joinsSHA256:hash(Buffer.from(G.joins.buffer)),rangesSHA256:hash(JSON.stringify(G.ranges)),expectedGroupCount:occurrence?G.ranges[occurrence.repeatPath].segments*occurrence.repeat+G.ranges[occurrence.appendPath].segments:G.segmentCount,metadataBackingBytes:paths.length*24,metadataOwnerBytes:paths.length*24+4096,maskLimit:spec.tiles==='multiple'?4096:8_000_000};
  preflight.push(facts);fs.writeFileSync(path.join(out,'preflight-progress.json'),JSON.stringify(preflight,null,2));
  assert.ok(validateCurveUpload(G,paths),'actual builder upload is valid for recipe '+spec.id);
  if(spec.geometry==='tail'){assert.ok(G.ranges.every(r=>r.segments===1));assert.equal(facts.expectedGroupCount,32769);}
 }
 const prepared={mode:'PREPARE_ONLY',browserStarted:false,serverStarted:false,networkStarted:false,nativeEvidence:false,candidate:pins.candidate,originalBaseline:pins.originalBaseline,sourceRoot:path.resolve(root),controlHashes:controlHashes(),sourceHashes:Object.fromEntries([...sources].map(([p,b])=>[p,hash(b)])),recipes,preflight,limits:{logicalBytes:64_000_000,maskPixels:8_000_000,transportChunkBytes:1_048_576},rootRunFlagName:'MAP_CURVE_EDGE_ROOT_RUN',rootRunFlagValue:CURVE_EDGE_ROOT_FLAG};
 fs.writeFileSync(path.join(out,'prepared.json'),JSON.stringify(prepared,null,2));console.log(JSON.stringify({mode:prepared.mode,cases:recipes.length,sourceFiles:sources.size,browserStarted:false,serverStarted:false,networkStarted:false,out}));
}
function standardGate(meta,spec,alternate){
 assert.deepEqual(meta.errors,[],'native subject/GL errors');assert.deepEqual(meta.cleanup.errors,[]);assert.deepEqual(meta.cleanup.glErrors,[]);
 assert.equal(meta.cleanup.budgetBytes,0);assert.equal(meta.cleanup.contextLostObserved,true);assert.equal(meta.cleanup.allResourcesDeletedOnce,true);
 const deleted=new Map;for(const o of meta.cleanup.deleted){const k=o.kind+':'+o.id;deleted.set(k,(deleted.get(k)||0)+1);}
 assert.ok(meta.cleanup.created.length>0);for(const o of meta.cleanup.created)assert.equal(deleted.get(o.kind+':'+o.id),1,'each native created object is explicitly deleted once');for(const o of meta.cleanup.deleted)assert.ok(meta.cleanup.created.some(c=>c.kind===o.kind&&c.id===o.id));
 assert.equal(meta.contextFacts.samples,0);for(const k of ['version','renderer','vendor','shadingLanguageVersion'])assert.ok(typeof meta.contextFacts[k]==='string'&&meta.contextFacts[k].length>0,'actual native '+k);for(const k of ['antialias','depth','stencil'])assert.equal(meta.contextFacts.attributes[k],false);
 assert.equal(meta.groupCount,meta.expectedPreflight.expectedGroupCount);
 const a=meta.ownershipBeforeCleanup;assert.ok(a&&a.bytes<=64_000_000&&a.peak<=64_000_000);assert.equal(a.entries.reduce((n,e)=>n+e.bytes,0),a.bytes);assert.ok(a.entries.every(e=>['model','group','mask','curve-bounds-and-mapping','fixed-cpu-gpu-scratch','original-pressure-buffer'].includes(e.kind)));
 assert.equal(meta.uploadSummary.pointsSHA256,meta.expectedPreflight.pointsSHA256);assert.equal(meta.uploadSummary.joinsSHA256,meta.expectedPreflight.joinsSHA256);assert.equal(meta.uploadSummary.rangesSHA256,meta.expectedPreflight.rangesSHA256);
 const gone=new Set;for(const e of meta.events){if(e.type==='deleteBuffer'&&e.id!==null)gone.add(e.id);if(e.type==='bindBuffer'&&e.args[1]!==null)assert.equal(gone.has(e.args[1]),false,'never bind a deleted buffer');}
 if(!(alternate&&spec.kind==='released-abort'))assert.equal(meta.drawError,null);
 if(alternate){
  const optional=a.entries.filter(e=>e.kind==='curve-bounds-and-mapping');assert.ok(optional.length<=1);if(!['metadata-denial','original-priority'].includes(spec.kind))assert.equal(optional.length,1,'active curve metadata must have the distinct counted owner');
  if(optional.length){assert.equal(optional[0].bytes,meta.expectedPreflight.metadataOwnerBytes);assert.equal(meta.metadataBacking.sameBuffer,true);assert.equal(meta.metadataBacking.bytes,meta.expectedPreflight.metadataBackingBytes);assert.equal(meta.resources.curveBoundsCPU+meta.resources.curveMappingCPU,meta.metadataBacking.bytes);}
  assert.equal(meta.resources.scratchCPU,meta.resources.scratchGPU);assert.ok([0,131072].includes(meta.resources.scratchCPU));
  if(['metadata-denial','scratch-denial','original-priority'].includes(spec.kind)){assert.ok(meta.stats.originalBinds>0);assert.equal(meta.stats.optimizedTiles,0);assert.equal(meta.submissions.length,0);if(spec.kind!=='scratch-denial')assert.equal(optional.length,0);if(spec.kind==='original-priority'){assert.ok(meta.stats.priorityDrops>0);assert.ok(meta.events.some(e=>e.type==='actual-original-pressure-allocation'));}}
  else if(spec.kind==='empty'){assert.ok(meta.stats.optimizedTiles>0);assert.ok(meta.stats.emptyTiles>0);assert.equal(meta.submissions.length,0);assert.equal(meta.stats.originalBinds,0);}
  else {
   assert.ok(meta.submissions.length>0,'intended active curve branch needs actual scratch uploads');assert.ok(meta.stats.indices>0);assert.ok(meta.stats.chunks>0);assert.equal(meta.submissions.reduce((n,s)=>n+s.count,0),meta.stats.indices);
   if(spec.kind==='released-abort'){assert.match(meta.drawError?.message??'',/snapshot expired/);assert.equal(meta.stats.staleAborts,1);assert.equal(meta.stats.liveReplays,0);assert.equal(meta.stats.originalBinds,0);assert.equal(meta.releasedFault.truthyHandle,true);assert.equal(meta.releasedFault.budgetOwned,false);assert.equal(meta.releasedFault.nativeBufferLive,false);assert.equal(meta.events.filter(e=>e.type==='drawArrays').length,0);}
   else if(spec.kind==='live-replay'){
    assert.equal(meta.stats.liveReplays,1);assert.equal(meta.stats.originalBinds,1);const ds=meta.events.flatMap((e,i)=>e.type==='drawArraysInstanced'?[i]:[]),clear=meta.events.findIndex((e,i)=>e.type==='clear'&&i>ds[0]),composite=meta.events.findIndex(e=>e.type==='drawArrays');assert.equal(ds.length,2);assert.ok(ds[0]<clear&&clear<ds[1]&&ds[1]<composite);assert.equal(meta.events.filter(e=>e.type==='drawArrays').length,1);
   }else{assert.equal(meta.stats.originalBinds,0);assert.ok(meta.stats.optimizedTiles>0);if(spec.kind==='tail')assert.deepEqual(meta.submissions.map(s=>s.count),[32768,1]);if(spec.kind==='full-curve')assert.equal(meta.stats.indices,meta.expectedPreflight.expectedGroupCount);}
  }
 }
}
async function run(preparedFile,out){
 // This check is deliberately BEFORE all filesystem preparation, server or browser imports.
 assert.equal(process.env.MAP_CURVE_EDGE_ROOT_RUN,CURVE_EDGE_ROOT_FLAG,'native execution is root-only and requires the exact explicit flag');
 assert.ok(!fs.existsSync(out),'new run output directory required');fs.mkdirSync(out,{recursive:true});
 const prepared=JSON.parse(fs.readFileSync(preparedFile));assert.equal(prepared.mode,'PREPARE_ONLY');assert.equal(prepared.candidate,pins.candidate);assert.deepEqual(prepared.controlHashes,controlHashes(),'controller/pins unchanged since PREPARE');assert.deepEqual(prepared.recipes,curveEdgeRecipes());
 const sources=sourceMap(prepared.sourceRoot);assert.deepEqual(Object.fromEntries([...sources].map(([p,b])=>[p,hash(b)])),prepared.sourceHashes,'closed served source bytes must match PREPARE');
 const {createServer}=await import('node:http');const {chromium}=await import('playwright-core');
 const requests=[],errors=[],results=[];let browser,server,browserVersion=null;const save=complete=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({complete,nativeEvidence:true,scope:'tiny edge contexts only',preparedSHA256:hash(fs.readFileSync(preparedFile)),candidate:pins.candidate,browserVersion,requests,errors,results},null,2));
 server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,b=sources.get(p);requests.push({method:req.method,path:p,known:!!b,sha256:b?hash(b):null});if(!b){res.writeHead(404);res.end('closed source set');return;}res.setHeader('Content-Type',p.endsWith('.html')?'text/html':'application/javascript');res.end(b);});
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=metal','--disable-background-networking']});browserVersion=browser.version();save(false);
  for(let index=0;index<prepared.recipes.length;index++){
   const spec=prepared.recipes[index],facts=prepared.preflight[index],row={id:spec.id,recipe:spec,subjects:[]};results.push(row);save(false);
   const page=await browser.newPage({viewport:{width:320,height:320},deviceScaleFactor:spec.dpr});page.on('pageerror',e=>errors.push({caseId:spec.id,message:e.message}));
   try{
    await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==`http://127.0.0.1:${server.address().port}`){errors.push({caseId:spec.id,message:'external request blocked',url:u.href});return r.abort();}return r.continue();});
    await page.goto(`http://127.0.0.1:${server.address().port}/curve-edge-fixture.html`);
    const buffers=[];
    for(const alternate of [false,true]){
     const name=alternate?'curve':'original',dir=path.join(out,spec.id,name);fs.mkdirSync(dir,{recursive:true});
     const header=await page.evaluate(async args=>(await import('/scripts/lib/map-curve-edge-tiny-program.mjs')).curveEdgeNativeSubject(args.spec,args.facts,args.alternate),{spec,facts,alternate});
     fs.writeFileSync(path.join(dir,'header.json'),JSON.stringify(header,null,2));assert.equal(new Set(header.blobs.map(b=>b.name)).size,header.blobs.length);const files={};
     for(const descriptor of header.blobs){
      assert.match(descriptor.name,/^(rgba|metadata|indices-\d+)$/);assert.ok(Number.isSafeInteger(descriptor.bytes)&&descriptor.bytes>=0&&descriptor.bytes<=8*1048576);const file=path.join(dir,descriptor.name+'.bin');fs.writeFileSync(file,Buffer.alloc(0));let offset=0;
      while(offset<descriptor.bytes){const length=Math.min(1_048_576,descriptor.bytes-offset);const chunk=await page.evaluate(async({name,offset,length})=>{const all=window.__curveTinyBlobs[name];if(!all||length<1||length>1048576||offset<0||offset+length>all.length)throw Error('invalid exact transport range');const b=all.subarray(offset,offset+length),sha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');return{offset,bytes:Array.from(b),sha256:sha};},{name:descriptor.name,offset,length});
       const bytes=Buffer.from(chunk.bytes);fs.writeFileSync(path.join(dir,descriptor.name+'-chunk-'+offset+'.bin'),bytes);fs.writeFileSync(path.join(dir,descriptor.name+'-chunk-'+offset+'.json'),JSON.stringify({offset:chunk.offset,bytes:bytes.length,sha256:chunk.sha256}));
       assert.equal(chunk.offset,offset);assert.equal(bytes.length,length);assert.equal(hash(bytes),chunk.sha256);fs.appendFileSync(file,bytes);offset+=length;
      }
      const bytes=fs.readFileSync(file);assert.equal(bytes.length,descriptor.bytes);assert.equal(hash(bytes),descriptor.sha256);files[descriptor.name]=bytes;
     }
     const meta=JSON.parse(files.metadata.toString('utf8'));fs.writeFileSync(path.join(dir,'metadata.json'),JSON.stringify(meta,null,2));row.subjects.push({name,browserVersion,metadataPath:path.join(dir,'metadata.json'),rgbaPath:path.join(dir,'rgba.bin'),rgbaSHA256:hash(files.rgba),metadata:meta});save(false);
     assert.equal(files.rgba.length,128*96*spec.dpr*spec.dpr*4);assert.deepEqual(meta.expectedPreflight,facts);standardGate(meta,spec,alternate);assert.ok(requests.every(r=>r.known));assert.deepEqual(errors,[]);
     if(!alternate&&!['empty','released-abort'].includes(spec.kind))assert.ok(files.rgba.some(x=>x!==0),'original native oracle must paint nonempty pixels');
     if(['empty','released-abort'].includes(spec.kind))assert.equal(files.rgba.some(x=>x!==0),false,'intentional transparent output');
     buffers.push(files.rgba);await page.evaluate(()=>{delete window.__curveTinyBlobs;});
    }
    let changed=0,max=0;for(let i=0;i<buffers[0].length;i++){const d=Math.abs(buffers[0][i]-buffers[1][i]);if(d)changed++;max=Math.max(max,d);}row.comparison={changed,max,bytes:buffers[0].length};save(false);assert.equal(changed,0,'exact original/curve native RGBA');row.pass=true;save(false);
   }finally{await page.close();}
  }
  assert.deepEqual(errors,[],'final errors after awaited page closure');assert.ok(requests.every(r=>r.known),'final closed source request set');
  save(true);console.log(JSON.stringify({pass:true,cases:results.length,out}));
 }catch(error){errors.push({name:error.name,message:error.message,stack:error.stack});save(false);throw error;}
 finally{await browser?.close();if(server?.listening)await new Promise(resolve=>server.close(resolve));}
}
const args=process.argv.slice(2);
if(args[0]==='--run-root-only'){assert.equal(args.length,3);await run(path.resolve(args[1]),path.resolve(args[2]));}
else{assert.equal(args.length,2,'PREPARE: BASE_ROOT NEW_OUTPUT_DIRECTORY');await prepare(path.resolve(args[0]),path.resolve(args[1]));}
