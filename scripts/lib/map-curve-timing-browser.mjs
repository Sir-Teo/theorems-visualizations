// New finite timing phase. All existing observers and the correctness prefix remain untouched.
import{oracleLog,ByteSHA256}from'./map-paired-atlas-observer.mjs';
import{resourceSnapshot}from'./map-paired-resource-observer.mjs';
import{epochMetadata}from'./map-paired-guarded-epoch.mjs';
import{FRAME_COUNT,TIMEOUT_MS,validateSample}from'./map-curve-timing-protocol.mjs';
function snapshot(s){const m=s.map,hash=new ByteSHA256,word=new Uint32Array(2);for(const[k,model]of s.models)for(const r of model.ranges){word[0]=r.startPoint;word[1]=r.segments;hash.update(new Uint8Array(word.buffer));}return {map:{W:m.W,H:m.H,dpr:m.dpr,k:m.k,tx:m.tx,ty:m.ty,zooming:m.zooming,dragging:m.dragging,selection:m.sel?.it.id||null,hover:m.hover?.it.id||null,highlight:m.hl?[...m.hl]:null,fields:[...m.show.fields],defs:m.show.defs,planned:m.show.planned},scene:{generation:s.generation,status:s.status,canvas:[s.canvas.width,s.canvas.height],control:s.controlKey,pending:s.pending.size},models:[...s.models].map(([key,o])=>({key,scale:o.scale,points:o.pointCount,segments:o.segmentCount,released:!!o.released,budgetOwned:s.budget.entries.has(o)})),rangesSHA256:hash.hex(),groups:[...s.groups].map(([key,g])=>({key,count:g.count,width:g.width,cap:g.cap,dash:g.dash,color:g.color?[...g.color]:g.color,coverage:g.coverage?[...g.coverage]:g.coverage,bounds:g.bounds?[...g.bounds]:g.bounds,budgetOwned:s.budget.entries.has(g)})),resources:s.resources(),classifiedResources:resourceSnapshot(s),stats:structuredClone(s.edges.stats||{}),loaded:{nodes:m.nodes.length,edges:m.edges.length}};}

const check=(x,m)=>{if(!x)throw Error('curve timing browser: '+m);};
const full=s=>({...snapshot(s),active:!!s.active,error:s.gl.getError()});
const scalar=s=>{const m=s.map;return{state:{W:m.W,H:m.H,dpr:m.dpr,k:m.k,tx:m.tx,ty:m.ty,zooming:m.zooming,dragging:m.dragging,selection:m.sel?.it.id||null,hover:m.hover?.it.id||null,control:s.controlKey,generation:s.generation,active:!!s.active,ready:s.status==='ready'&&s.pending.size===0&&document.fonts.status==='loaded'&&!m.dead&&!m._raf&&!m.anim},stats:Object.fromEntries(['optimizedTiles','chunks','indices','originalBinds','liveReplays','staleAborts','metadataDrops','priorityDrops'].map(k=>[k,s.edges.stats?.[k]||0]))};};
export async function captureTimingTail(scene,variant,{raf=()=>new Promise(requestAnimationFrame),now=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const m=scene.map,e=window.__pairedEpoch,log=oracleLog(),cb=globalThis.__pairedCallbacks;
 const t=window.__curveTiming={protocol:'24 fixed-state requested draws; all collectors enabled',variant,samples:[],stamps:[],drains:[],complete:false,prefixEnd:e.historyEnd,prefixCallbackEnd:e.callbackEnd,prefixTrace:structuredClone(e.trace),prefixCallbacks:structuredClone(cb.events),failure:null};
 const traceRef=log.events,cbRef=cb.events,recorder=globalThis.__pairedCallbackRecord,oldDraw=m._draw,originalRAF=globalThis.requestAnimationFrame,originalCancel=globalThis.cancelAnimationFrame;let active=null,aborted=false,timer=null,deadlineAt;const ownedFrames=new Set();
 t.deadline={limitMS:TIMEOUT_MS,canceledFrames:[],lateCallbacks:[],aborted:false};let rejectAbort;const abortPromise=new Promise((_,reject)=>{rejectAbort=reject;});abortPromise.catch(()=>{});
 const note=(kind,detail={})=>{try{globalThis.__pairedCallbackRecord?.(kind,detail);}catch(error){t.deadline.loggingFailure=error.message;}};
 const abort=error=>{if(aborted)return;aborted=true;t.deadline.aborted=true;t.deadline.reason=error.message;for(const id of ownedFrames){try{originalCancel?.call(globalThis,id);}catch(e){t.deadline.cancelFailure=e.message;}t.deadline.canceledFrames.push(id);}if(ownedFrames.has(m._raf))m._raf=0;ownedFrames.clear();note('timing-aborted',{message:error.message});rejectAbort(error);};
 let resolveStopped;const stopped=new Promise(resolve=>{resolveStopped=resolve;});window.__curveTimingStop={abort,stopped};
 const arm=start=>{if(timer!==null)clearTimer(timer);deadlineAt=start+TIMEOUT_MS;t.deadline.absoluteAt=deadlineAt;timer=setTimer(()=>abort(Error('absolute browser timing deadline expired')),TIMEOUT_MS);};
 const alive=()=>{if(aborted)throw Error(t.deadline.reason);if(now()>=deadlineAt){const error=Error('absolute browser timing deadline expired');abort(error);throw error;}};
 const waitFrame=async()=>{alive();await Promise.race([Promise.resolve().then(()=>{alive();return raf();}),abortPromise]);alive();};
 const wrappedRAF=typeof originalRAF==='function'?function(callback){alive();let id;id=originalRAF.call(this,stamp=>{ownedFrames.delete(id);if(aborted){const row={id,stamp};t.deadline.lateCallbacks.push(row);note('timing-aborted-late-RAF',row);return;}callback(stamp);});ownedFrames.add(id);return id;}:null;
 if(wrappedRAF)globalThis.requestAnimationFrame=wrappedRAF;arm(now());
 try{
  check(e.frames.length===12&&e.frames.at(-1).label==='A3'&&e.frames.every(f=>f.completed),'complete original prefix');
  await waitFrame();await waitFrame();check(log.events===traceRef&&cb.events===cbRef&&log.events.length===t.prefixEnd&&cb.events.length===t.prefixCallbackEnd,'fixed drains are quiet');
  t.beforeWindow=full(scene);t.state=scalar(scene).state;check(t.state.ready&&t.state.active&&t.state.zooming===true,'ready active zooming state');t.historyStart=log.events.length;t.callbackStart=cb.events.length;
  m._draw=function(...args){const begin=now();try{return oldDraw.apply(this,args);}catch(error){if(active)active.drawFailure=error.message;throw error;}finally{if(active)active.drawMS.push(now()-begin);}};
  let previous;for(let i=0;i<FRAME_COUNT;i++){
   log.stage='timing-'+i;cb.phase=log.stage;active={index:i,start:log.events.length,callbackStart:cb.events.length,before:scalar(scene),drawMS:[],completed:false};t.samples.push(active);
   if(i===0){alive();t.t0=now();previous=t.t0;t.stamps.push(t.t0);arm(t.t0);}alive();m.draw();await waitFrame();const stamp=now();active.stamp=stamp;active.interval=stamp-previous;t.stamps.push(stamp);previous=stamp;active.after=scalar(scene);active.end=log.events.length;active.callbackEnd=cb.events.length;active.completed=true;t.elapsed=stamp-t.t0;
   validateSample(active,variant,t.state);check(t.elapsed<=TIMEOUT_MS,'30 second timeout');active=null;
  }
  t.historyEnd=log.events.length;t.callbackEnd=cb.events.length;t.trace=structuredClone(log.events.slice(t.historyStart));t.callbacks=structuredClone(cb.events.slice(t.callbackStart));
  check(globalThis.__pairedAtlasLog===log&&globalThis.__pairedCallbacks===cb&&log.events===traceRef&&cb.events===cbRef&&globalThis.__pairedCallbackRecord===recorder,'observer identities');t.identitiesStable=true;
  const drainStart=now();for(let i=0;i<2;i++){await waitFrame();t.drains.push(now()-drainStart);}check(log.events.length===t.historyEnd&&cb.events.length===t.callbackEnd,'final drains are quiet');
  check(JSON.stringify(log.events.slice(0,t.prefixEnd))===JSON.stringify(t.prefixTrace)&&JSON.stringify(cb.events.slice(0,t.prefixCallbackEnd))===JSON.stringify(t.prefixCallbacks),'prefix contents retained');t.afterWindow=full(scene);t.complete=true;
 }catch(error){t.failure={message:error.message,stack:error.stack};abort(error);throw error;}
 finally{if(timer!==null)clearTimer(timer);if(wrappedRAF)globalThis.requestAnimationFrame=originalRAF;t.rafRestored=globalThis.requestAnimationFrame===originalRAF;m._draw=oldDraw;t.drawRestored=m._draw===oldDraw;if(t.historyEnd===undefined)t.historyEnd=log.events.length;if(t.callbackEnd===undefined)t.callbackEnd=cb.events.length;t.trace??=structuredClone(log.events.slice(t.historyStart??t.prefixEnd));t.callbacks??=structuredClone(cb.events.slice(t.callbackStart??t.prefixCallbackEnd));log.stage='post-timing-transfer';cb.phase='post-timing-transfer';resolveStopped();}
 return{samples:t.samples.length,complete:t.complete};
}
export function timingEvidence(){const t=window.__curveTiming;if(!t)return null;return{...structuredClone(t),postHistory:structuredClone(oracleLog().events.slice(t.historyEnd??0)),postCallbacks:structuredClone(globalThis.__pairedCallbacks.events.slice(t.callbackEnd??0))};}
export function timingMetadata(){return{...epochMetadata(),timing:timingEvidence()};}

export async function stopTimingTail(message){const stop=window.__curveTimingStop;if(stop){stop.abort(Error(message));await stop.stopped;}}
