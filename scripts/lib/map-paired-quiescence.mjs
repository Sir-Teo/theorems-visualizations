// Private observational preparation. Never suppresses an existing callback or retries until quiet.
export function installCallbackProvenance(){
 if(globalThis.__pairedCallbacks)return;
 const log=globalThis.__pairedCallbacks={phase:'initialization',events:[],characters:0};
 globalThis.__pairedCallbackRecord=(kind,detail={})=>{const row={kind,phase:log.phase,glyphEventIndex:globalThis.__pairedAtlasLog?.events.length||0,...detail},s=JSON.stringify(row);if(log.events.length>=100000||log.characters+s.length>16000000)throw Error('callback provenance cap exceeded');log.characters+=s.length;log.events.push(row);};
 const faces=e=>[...(e?.fontfaces||[])].map(f=>({family:f.family,style:f.style,weight:f.weight,stretch:f.stretch,status:f.status}));
 for(const type of['loading','loadingdone','loadingerror'])document.fonts.addEventListener(type,e=>globalThis.__pairedCallbackRecord('font-event',{type,status:document.fonts.status,faces:faces(e)}));
}
export function callbackEvent(kind,detail={}){if(!globalThis.__pairedCallbackRecord)throw Error('initial callback observer absent');globalThis.__pairedCallbackRecord(kind,{...detail,stack:new Error().stack});}
export function observeCallback(kind,fn){return function(...args){callbackEvent(kind,{event:args[0]?.type||null});return fn.apply(this,args);};}
export function provenanceSources(graph,scene){
 const prefix="import{callbackEvent,observeCallback}from'/scripts/lib/map-paired-quiescence.mjs';\n";
 function replace(s,a,b){if(!s.includes(a))throw Error('provenance source seam absent '+a);return s.replace(a,b);}
 graph=replace(graph,'document.fonts?.ready.then(this.onFonts);','this.onFonts=observeCallback(\'graph-fonts\',this.onFonts); document.fonts?.ready.then(this.onFonts);');
 graph=replace(graph,'new ResizeObserver(() => { this.resize();','new ResizeObserver(() => { callbackEvent(\'graph-resize\'); this.resize();');
 graph=replace(graph,'this.onTheme = () => { this.mapRaster','this.onTheme = () => { callbackEvent(\'graph-theme\'); this.mapRaster');
 graph=replace(graph,'  draw() {\n    if (this.dead','  draw() {\n    callbackEvent(\'map-draw-request\',{pendingRAF:!!this._raf,dead:!!this.dead});\n    if (this.dead');
 graph=replace(graph,'requestAnimationFrame(() => { this._raf = 0; this._draw(); });','requestAnimationFrame(() => { callbackEvent(\'map-RAF-entry\'); this._raf = 0; this._draw(); });');
 scene=replace(scene,"this.canvas.addEventListener('webglcontextlost', this.onLost);","for(const key of ['onFonts','onLost','onRestored'])this[key]=observeCallback('scene-'+key,this[key]); this.canvas.addEventListener('webglcontextlost', this.onLost);");
 // Focus listeners were registered just before this seam: observe the actual existing callback body instead.
 scene=replace(scene,'this.onFocus = () => { if (!this.dead)','this.onFocus = () => { callbackEvent(\'scene-focus-body\'); if (!this.dead)');
 scene=replace(scene,'this.worker.onmessage = ({ data }) => {','this.worker.onmessage = ({ data }) => { callbackEvent(\'scene-worker-message\',{request:data.request});');
 scene=replace(scene,'this.ready = Promise.all([','callbackEvent(\'scene-prewarm-start\'); this.ready = Promise.all([');
 scene=replace(scene,"{ this.status = 'ready'; this.map.draw(); }","{ callbackEvent('scene-prewarm-ready'); this.status = 'ready'; this.map.draw(); }");
 return{graph:prefix+graph,scene:prefix+scene};
}
export async function prepareFixedQuiescence(scene,{fontSet=document.fonts,macro=()=>new Promise(r=>setTimeout(r,0)),raf=()=>new Promise(r=>requestAnimationFrame(r))}={}){
 const log=globalThis.__pairedCallbacks;if(!log)throw Error('callback observer not installed');const m=scene.map;
 log.phase='explicit-font-preparation';
 // The exact history needs Inter600 chapter/field labels and italic Newsreader500 titles.
 // Load every actual map character for these two faces; size does not select another font face.
 const words=[...m.nodes.map(n=>n.it.name||''),...m.G.collections.flatMap(c=>[c.title||c.name||'',...c.chapters.map(ch=>`${ch.n} · ${ch.title}`)]),...(m.G.map?.fields||[]).map(f=>f.title.toUpperCase()),...(m.G.map?.rows||[]).map(r=>r.label),...m.G.fields.map(f=>(f.short||f.id).toUpperCase()),'Ch 0123456789…'];
 const text=[...new Set(words.join(' '))].sort().join('');if(text.length>65536)throw Error('font character diagnostic cap');
 const requests=[{font:'600 11px Inter',text},{font:'italic 500 32px Newsreader',text}];
 for(const request of requests){callbackEvent('explicit-font-load',{font:request.font,characters:request.text.length});const faces=await fontSet.load(request.font,request.text);callbackEvent('explicit-font-loaded',{font:request.font,faces:[...faces].map(f=>({family:f.family,style:f.style,weight:f.weight,status:f.status}))});}
 await fontSet.ready;await scene.ready;
 log.phase='fixed-drain';for(const[step,wait]of[['macro',macro],['raf1',raf],['raf2',raf],['final-macro',macro]]){callbackEvent('preparation-checkpoint',{step});await wait();}
 const state=()=>JSON.stringify({W:m.W,H:m.H,dpr:m.dpr,k:m.k,tx:m.tx,ty:m.ty,control:scene.controlKey,generation:scene.generation,models:[...scene.models].map(([k,v])=>[k,!!v.released]),pending:scene.pending.size});
 if(fontSet.status!=='loaded'||scene.status!=='ready'||scene.pending.size||[...scene.models.keys()].sort().join(',')!=='bundles:0.5,edges:0.5,edges:4'||[...scene.models.values()].some(v=>v.released)||m._raf||m.anim)throw Error('pre-quiet readiness gate');
 const before=state(),start=log.events.length;log.phase='fixed-quiet';await macro();await raf();await raf();await macro();
 const unexpected=log.events.slice(start);if(unexpected.length||state()!==before||fontSet.status!=='loaded'||m._raf||m.anim)throw Error('fixed quiet interval was not quiet');
 log.phase='explicit-main-history';return{requests:requests.map(r=>({font:r.font,characters:r.text.length})),quietStart:start,quietEnd:log.events.length,schedule:['macro','raf','raf','macro'],snapshot:JSON.parse(before)};
}
