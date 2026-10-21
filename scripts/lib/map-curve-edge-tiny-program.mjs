// Browser entry is invoked only by the root-only runner after PREPARE/source review.
// Actual native GL, actual builder, OriginalSceneEdges and the exact pinned curve factory.
export async function curveEdgeNativeSubject(spec,preflight,alternate) {
 const {SceneEdges}=await import('/assets/js/map-scene-edges.js');
 const {SceneBudget}=await import('/assets/js/map-scene-gl.js');
 const {buildWorldPaths}=await import('/assets/js/map-scene-model.js');
 const {curveBoundsEdgesClass}=await import('/scripts/lib/map-curve-bounds-runtime.mjs');
 const {curveEdgePaths,curveEdgeOccurrences,curveEdgeStyleBounds}=await import('/scripts/lib/map-curve-edge-tiny-recipes.mjs');
 const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const width=128,height=96,pw=width*spec.dpr,ph=height*spec.dpr;
 const canvas=document.createElement('canvas');canvas.width=pw;canvas.height=ph;document.body.append(canvas);
 const rgba=new Uint8Array(pw*ph*4),events=[],submissions=[],errors=[],objects=new WeakMap(),created=[],deleted=[];
 let serial=0,e,gl,budget,model,group,pressure,drawError=null,uploadSummary=null,ownershipBeforeCleanup=null,stats=null,resources=null;
 let contextFacts=null,metadataBacking=null,releasedFault=null,cleanup={errors:[],budgetBytes:null,contextLostObserved:false,allResourcesDeletedOnce:false};
 const id=o=>{if(!o)return null;if(!objects.has(o))objects.set(o,++serial);return objects.get(o);};
 const event=(type,data={})=>events.push({n:events.length,type,...data});
 const drain=()=>{if(!gl)return [];const a=[];for(let i=0;i<16;i++){const x=gl.getError();if(x===gl.NO_ERROR)break;a.push(x);}return a;};
 const kind=o=>o?.kind==='curve-bounds-and-mapping'?'curve-bounds-and-mapping':o?.kind==='original-pressure-buffer'?'original-pressure-buffer':o&&'capacity'in o&&'cpu'in o?'fixed-cpu-gpu-scratch':o&&'pointCount'in o?'model':o&&'count'in o&&'width'in o?'group':o&&'framebuffer'in o&&'height'in o?'mask':'unknown';
 const owners=()=>budget?[...budget.entries].map(([o,v])=>({id:id(o),kind:kind(o),bytes:v.bytes,evictable:v.evictable})):[];
 const account=()=>({bytes:budget?.bytes??0,peak:budget?.peak??0,entries:owners()});
 let pointStagingBytes=0,indexStagingBytes=0,fixtureIdsBytes=0,groupCount=null;
 try {
  gl=canvas.getContext('webgl2',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,preserveDrawingBuffer:true});
  if(!gl)throw Error('native WebGL2 unavailable');
  const debugRenderer=gl.getExtension('WEBGL_debug_renderer_info');
  contextFacts={attributes:gl.getContextAttributes(),samples:gl.getParameter(gl.SAMPLES),version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER),vendor:gl.getParameter(gl.VENDOR),shadingLanguageVersion:gl.getParameter(gl.SHADING_LANGUAGE_VERSION),unmaskedRenderer:debugRenderer?gl.getParameter(debugRenderer.UNMASKED_RENDERER_WEBGL):null,unmaskedVendor:debugRenderer?gl.getParameter(debugRenderer.UNMASKED_VENDOR_WEBGL):null};
  for(const name of ['createBuffer','createTexture','createFramebuffer','createVertexArray','createShader','createProgram']){
   const original=gl[name].bind(gl);gl[name]=(...args)=>{const o=original(...args);if(o)created.push({kind:name.slice(6),id:id(o)});event(name,{id:id(o)});return o;};
  }
  for(const name of ['deleteBuffer','deleteTexture','deleteFramebuffer','deleteVertexArray','deleteShader','deleteProgram']){
   const original=gl[name].bind(gl);gl[name]=o=>{if(o)deleted.push({kind:name.slice(6),id:id(o)});event(name,{id:id(o)});return original(o);};
  }
  for(const name of ['bindBuffer','clear','drawArrays','drawArraysInstanced','bindFramebuffer']){
   const original=gl[name].bind(gl);gl[name]=(...args)=>{event(name,{args:args.map(x=>typeof x==='object'?id(x):x)});return original(...args);};
  }
  const oldBufferData=gl.bufferData.bind(gl);gl.bufferData=(target,data,usage)=>{event('bufferData',{target,bytes:typeof data==='number'?data:data.byteLength,usage});return oldBufferData(target,data,usage);};
  const oldSub=gl.bufferSubData.bind(gl);let released=false;
  gl.bufferSubData=(target,offset,data,start=0,length=data.length-start)=>{
   const copy=new Uint32Array(data.subarray(start,start+length));submissions.push(copy);event('bufferSubData',{target,offset,count:length,first:copy[0]??null,last:copy.at(-1)??null});
   const result=oldSub(target,offset,data,start,length);
   if(alternate&&spec.kind==='released-abort'&&!released){released=true;e.releaseGroup(group);releasedFault={truthyHandle:!!group.buffer,budgetOwned:budget.entries.has(group),nativeBufferLive:gl.isBuffer(group.buffer),buffer:id(group.buffer)};event('released-original-group',releasedFault);}
   return result;
  };
  budget=new SceneBudget(64_000_000);
  const reserve=budget.reserve.bind(budget),release=budget.release.bind(budget);
  budget.reserve=(o,bytes,dispose,options)=>{event('reserve-begin',{owner:id(o),kind:kind(o),bytes});try{return reserve(o,bytes,dispose,options);}finally{event('reserve-end',{owner:id(o),account:account()});}};
  budget.release=o=>{event('release-begin',{owner:id(o),kind:kind(o)});try{return release(o);}finally{event('release-end',{owner:id(o),account:account()});}};
  const Type=alternate?curveBoundsEdgesClass(SceneEdges):SceneEdges;
  e=new Type(gl,budget,{maxMaskPixels:spec.tiles==='multiple'?4096:8_000_000});
  if(alternate&&spec.kind==='metadata-denial')e.optionalLimit=0;
  const paths=curveEdgePaths(spec.geometry);let G=buildWorldPaths(paths,4,{textureWidth:8,includeInstances:false});
  uploadSummary={points:G.pointCount,segments:G.segmentCount,ranges:G.ranges.map(r=>({...r})),pointsSHA256:await sha(new Uint8Array(G.points.buffer)),joinsSHA256:await sha(new Uint8Array(G.joins.buffer)),rangesSHA256:await sha(new TextEncoder().encode(JSON.stringify(G.ranges))),pointBytes:G.points.byteLength,joinInputBytes:G.joins.byteLength};
  pointStagingBytes=G.points.byteLength+G.joins.byteLength;model=e.upload(G,paths);G=null;
  const occurrence=curveEdgeOccurrences(spec),ids=occurrence?new Uint32Array(occurrence.repeat+1):Uint32Array.from(paths.map((_,i)=>i));
  if(occurrence){ids.fill(occurrence.repeatPath);ids[occurrence.repeat]=occurrence.appendPath;}
  let count=0;for(const i of ids)count+=model.ranges[i].segments;
  let indices=new Uint32Array(count),at=0;for(const i of ids){const r=model.ranges[i];for(let j=0;j<r.segments;j++)indices[at++]=r.startPoint+j;}
  indexStagingBytes=indices.byteLength;
  const coverage=[-(2**20),-(2**20),2**20,2**20],style={color:[.3,.6,.9,.55],width:2,cap:spec.cap,dash:spec.dash,bounds:curveEdgeStyleBounds(paths,spec)};
  if(alternate)e.__construction={model,key:'gray',ids,paths,coverage};
  try{group=e.group(indices,style);}finally{if(alternate)e.__construction=null;}
  indices=null;fixtureIdsBytes=ids.byteLength;groupCount=group.count;group.model=model;group.coverage=coverage;
  const view={width,height,dpr:spec.dpr,k:spec.k,tx:spec.tx,ty:spec.ty};
  if(alternate)e.scene={map:{...view,W:width,H:height},groups:new Map([['4:gray',group]]),visibleEdges:ids,paths,generation:1,controlKey:'tiny-native-fixed'};
  e.ensureMask(pw,ph);
  if(alternate&&spec.kind==='scratch-denial')e.optionalLimit=budget.bytes;
  if(spec.kind==='original-priority'){
   if(alternate)e.ensureScratch();
   const originals=owners().filter(o=>!['curve-bounds-and-mapping','fixed-cpu-gpu-scratch'].includes(o.kind)).reduce((s,o)=>s+o.bytes,0);
   pressure={kind:'original-pressure-buffer',buffer:null};const bytes=budget.limit-originals-4096;
   budget.reserve(pressure,bytes,()=>{if(pressure.buffer)gl.deleteBuffer(pressure.buffer);});
   pressure.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pressure.buffer);gl.bufferData(gl.ARRAY_BUFFER,bytes,gl.DYNAMIC_DRAW);
   event('actual-original-pressure-allocation',{bytes,buffer:id(pressure.buffer)});
  }
  if(alternate&&spec.kind==='live-replay')e.fault={afterChunks:1,mode:'live'};
  gl.enable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,pw,ph);gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  if(!(spec.kind==='released-abort'&&!alternate)){
   try{e.union(model,[group],view);}catch(error){drawError={name:error.name,message:error.message};}
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,pw,ph,gl.RGBA,gl.UNSIGNED_BYTE,rgba);
  errors.push(...drain());stats=alternate?structuredClone(e.stats):null;resources=alternate?e.optionalResources():null;
  ownershipBeforeCleanup=account();
  metadataBacking=alternate&&e.meta?{sameBuffer:e.meta.bounds.buffer===e.meta.mapping.buffer,bytes:e.meta.storage.byteLength,boundsBytes:e.meta.bounds.byteLength,mappingBytes:e.meta.mapping.byteLength}:null;
  event('capture',{drawError,glErrors:errors,account:ownershipBeforeCleanup});
 }catch(error){errors.push({name:error.name,message:error.message});event('subject-error',{name:error.name,message:error.message});}
 finally{
  try{e?.destroy();budget?.clear();cleanup.budgetBytes=budget?.bytes??0;cleanup.glErrors=drain();}catch(error){cleanup.errors.push({name:error.name,message:error.message});}
  const counts=new Map;for(const o of deleted)counts.set(o.kind+':'+o.id,(counts.get(o.kind+':'+o.id)||0)+1);
  cleanup.allResourcesDeletedOnce=created.every(o=>counts.get(o.kind+':'+o.id)===1)&&deleted.every(o=>created.some(c=>c.kind===o.kind&&c.id===o.id));
  cleanup.created=created;cleanup.deleted=deleted;
  if(gl){try{const ext=gl.getExtension('WEBGL_lose_context');if(!ext)throw Error('context cleanup extension unavailable');cleanup.contextLostObserved=await new Promise(resolve=>{const timer=setTimeout(()=>{event('context-loss-timeout');resolve(false);},2000);canvas.addEventListener('webglcontextlost',()=>{clearTimeout(timer);event('context-lost-observed');resolve(true);},{once:true});event('context-loss-requested');ext.loseContext();});}catch(error){cleanup.errors.push({name:error.name,message:error.message});}}
  canvas.remove();event('cleanup',{budgetBytes:cleanup.budgetBytes,contextLostObserved:cleanup.contextLostObserved});
 }
 const metadata={caseId:spec.id,alternate,width:pw,height:ph,origin:'bottom-left',drawError,errors,uploadSummary,groupCount,stats,resources,ownershipBeforeCleanup,releasedFault,cleanup,events,submissions:submissions.map(a=>({count:a.length,first:a[0]??null,last:a.at(-1)??null})),diagnosticCPU:{readbackBytes:rgba.byteLength,submissionSnapshotBytes:submissions.reduce((s,a)=>s+a.byteLength,0),inputPointStagingBytes:pointStagingBytes,inputIndexStagingBytes:indexStagingBytes,fixtureIdsBytes,notCandidateBudgetOwners:true},expectedPreflight:preflight,contextFacts,metadataBacking};
 // Raw bytes remain available even if a later gate fails. Node pulls bounded, hash-checked chunks.
 const blobs={rgba,metadata:new TextEncoder().encode(JSON.stringify(metadata))};
 for(let i=0;i<submissions.length;i++)blobs['indices-'+i]=new Uint8Array(submissions[i].buffer);
 window.__curveTinyBlobs=blobs;
 return {blobs:await Promise.all(Object.entries(blobs).map(async([name,bytes])=>({name,bytes:bytes.byteLength,sha256:await sha(bytes)})))};
}
