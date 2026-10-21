// Concurrent GPU-counter diagnostic. This is deliberately not an FPS gate.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from './serve.mjs';
import {mapScenePrototype} from './lib/map-scene-prototype.mjs';
const output=process.argv[2]||'/tmp/atlas-map-scene-gpu.json',source=await readFile(new URL('../assets/js/graph.js',import.meta.url),'utf8'),instrumented=mapScenePrototype(source),hash=x=>createHash('sha256').update(x).digest('hex'),hashes={};
for(const name of ['graph','map-webgl-scene','map-scene-model','map-scene-edges','map-scene-gl','map-scene-text','map-scene-painter','map-scene-decorations','map-scene-worker'])hashes[name]=hash(await readFile(new URL(`../assets/js/${name}.js`,import.meta.url)));
const frozenData=new Map();for(const name of ['index','planned']){const bytes=await readFile(new URL(`../data/${name}.json`,import.meta.url));frozenData.set(name,bytes);hashes[`data/${name}`]=hash(bytes);}
const server=createServer();await new Promise(r=>server.listen(0,r));const executablePath='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args=['--use-angle=metal'],browser=await chromium.launch({executablePath,headless:true,args}),results=[];
try{for(const width of [1440,3840]){
 const page=await browser.newPage({viewport:{width,height:width===1440?1000:2160},deviceScaleFactor:2,colorScheme:'light'});for(const [name,body]of frozenData)await page.route(`**/data/${name}.json`,r=>r.fulfill({body,contentType:'application/json'}));await page.route('**/assets/js/graph.js',r=>r.fulfill({body:instrumented,contentType:'application/javascript'}));
 try{await page.goto(`http://localhost:${server.address().port}/#/map`);await page.waitForFunction(()=>window.__mapAudit?.__scene?.status==='ready',null,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
 for(const selected of [false,true]){const result=await page.evaluate(async selected=>{
  const m=window.__mapAudit,s=m.__scene,gl=s.gl,ext=gl.getExtension('EXT_disjoint_timer_query_webgl2'),debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),raf=()=>new Promise(requestAnimationFrame),target=m.byId.get('ladr-2.30');if(!ext)return{available:false,renderer};
  m.select(null,false);m.hover=null;m.hl=null;m.userMoved=true;m.finishZoom();m.k=.8;m.tx=m.W/2-target.x*m.k;m.ty=m.H/2-target.y*m.k;if(selected)m.select(target,false);cancelAnimationFrame(m._raf);m._raf=0;
  for(let i=0;i<3;i++){s.draw();await raf();}assertNoError();function assertNoError(){const e=gl.getError();if(e)throw Error('GPU profile GL error '+e);}
  const pending=[],samples=[];let current=null,phase=false;
  const begin=label=>{const query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);current={label,query};},end=()=>{if(!current)return;gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(current);current=null;};
  const originalUnion=s.edges.union,originalNodes=s.painter.nodes;
  s.edges.union=function(...args){if(phase){end();begin('edge coverage + color composition');}const value=originalUnion.apply(this,args);if(phase)end();return value;};
  s.painter.nodes=function(...args){if(phase){end();begin('node sprites');}const value=originalNodes.apply(this,args);if(phase){end();begin('labels / post-node work');}return value;};
  try{for(let repeat=0;repeat<3;repeat++){await raf();begin('whole warm scene');s.draw();end();await raf();phase=true;begin('background decorations');s.draw();end();phase=false;await raf();}}
  finally{s.edges.union=originalUnion;s.painter.nodes=originalNodes;end();}
  // Whole-frame omission experiments locate costs without summing intrusive
  // per-pass counters. These stripped pictures are diagnostic only.
  const originalDirect=s.edges.direct,originalRect=s.painter.rect,originalText=s.painter.text;
  try{for(const omit of ['none','edges','nodes','decorations']){s.edges.union=omit==='edges'?()=>{}:originalUnion;s.edges.direct=omit==='edges'?()=>{}:originalDirect;s.painter.nodes=omit==='nodes'?()=>{}:originalNodes;s.painter.rect=omit==='decorations'?()=>{}:originalRect;s.painter.text=omit==='decorations'?()=>{}:originalText;for(let repeat=0;repeat<3;repeat++){await raf();begin('whole scene, omit '+omit);s.draw();end();const q=pending.at(-1).query,waited=performance.now();while(!gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)){await raf();if(performance.now()-waited>10000)throw Error('Omission query timed out');}}}}
  finally{s.edges.union=originalUnion;s.edges.direct=originalDirect;s.painter.nodes=originalNodes;s.painter.rect=originalRect;s.painter.text=originalText;}
  const started=performance.now();while(pending.some(p=>!gl.getQueryParameter(p.query,gl.QUERY_RESULT_AVAILABLE))){await raf();if(performance.now()-started>10000)throw Error('GPU timer results timed out');}
  const disjoint=!!gl.getParameter(ext.GPU_DISJOINT_EXT);for(const p of pending){samples.push({label:p.label,nanoseconds:gl.getQueryParameter(p.query,gl.QUERY_RESULT)});gl.deleteQuery(p.query);}assertNoError();return{available:true,renderer,selected,disjoint,nodes:m.nodes.length,edges:m.edges.length,k:m.k,width:m.W,height:m.H,dpr:m.dpr,samples,resources:s.resources()};
 },selected);assert.ok(result.available);assert.equal(result.disjoint,false);results.push(result);console.log(JSON.stringify(result));}
 }finally{await page.close();}}
 await writeFile(output,JSON.stringify({complete:true,diagnostic:true,method:'EXT_disjoint_timer_query_webgl2 TIME_ELAPSED_EXT on three warm stationary frames, three separately instrumented per-pass frames, and three whole-frame omission experiments for each of none/edges/nodes/decorations per state; omitted components are incomplete diagnostic pictures and never correctness/FPS evidence; counters include GPU scheduling and possible command-stream gaps. Other team/native work may run concurrently. No FPS or quiet-window performance claim.',date:new Date().toISOString(),browser:browser.version(),executablePath,args,hashes,results},null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r));}
