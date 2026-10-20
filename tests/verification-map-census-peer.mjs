// Explicit independent operation census. No timings, picture claims, or renderer edits.
import assert from'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import{pathToFileURL}from'node:url';import{chromium}from'playwright-core';
const [root,dataRoot,output]=process.argv.slice(2);assert.ok(root&&dataRoot&&output,'usage: node tests/verification-map-census-peer.mjs IMMUTABLE_ARCHIVE FROZEN_DATA OUTPUT');
const hash=x=>createHash('sha256').update(x).digest('hex'),producer=JSON.parse(await readFile(`${root}/docs/verification/map-scene-area-census.json`)),hashes={};
const frozen={};for(const n of['index','planned']){frozen[n]=await readFile(`${dataRoot}/${n}.json`);hashes[`data/${n}`]=hash(frozen[n]);assert.equal(hashes[`data/${n}`],producer.hashes[`data/${n}`]);}
for(const n of['graph','map-webgl-scene','map-scene-edges','map-scene-model']){hashes[n]=hash(await readFile(`${root}/assets/js/${n}.js`));assert.equal(hashes[n],producer.hashes[n]);}
assert.equal(hash(await readFile(`${root}/docs/verification/map-scene-area-census.json`)),'d6bff5c4ab8cb4a23007ffc703a939edad14fbb0bc9bb7f01d183a355e61d2b8');
const{createServer}=await import(pathToFileURL(`${root}/scripts/serve.mjs`)),{mapScenePrototype}=await import(pathToFileURL(`${root}/scripts/lib/map-scene-prototype.mjs`));
const css=await readFile(`${dataRoot}/atlas.css`);hashes['data/atlas.css']=hash(css);
const source=await readFile(`${root}/assets/js/graph.js`,'utf8'),server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--use-angle=metal']}),results=[];
try{for(const width of[1440,3840]){const page=await browser.newPage({viewport:{width,height:width===1440?1000:2160},deviceScaleFactor:2,colorScheme:'light'});try{
 for(const[n,bytes]of Object.entries(frozen))await page.route(`**/data/${n}.json`,r=>r.fulfill({body:bytes,contentType:'application/json'}));
 await page.route('**/data/atlas.css',r=>r.fulfill({body:css,contentType:'text/css'}));
 await page.route('**/assets/js/graph.js',r=>r.fulfill({body:mapScenePrototype(source),contentType:'application/javascript'}));
 await page.goto(`http://localhost:${server.address().port}/#/map`);await page.waitForFunction(()=>window.__mapAudit?.__scene?.status==='ready',null,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
 for(const selected of[false,true]){const result=await page.evaluate(selected=>{
  const m=window.__mapAudit,s=m.__scene,e=s.edges,gl=s.gl,fail=(b,msg)=>{if(!b)throw Error(msg);},same=(a,b,msg)=>fail(JSON.stringify(a)===JSON.stringify(b),msg),target=m.byId.get('ladr-2.30');
  m.select(null,false);m.hover=null;m.hl=null;m.userMoved=true;m.finishZoom();m.k=.8;m.tx=m.W/2-target.x*m.k;m.ty=m.H/2-target.y*m.k;if(selected)m.select(target,false);cancelAnimationFrame(m._raf);m._raf=0;s.invalidate();
  fail(m.show.defs&&m.show.planned&&m.show.fields.size===13,'full controls');fail(m.nodes.every(n=>m.visible(n)),'hidden node inventory');same(m.nodes.map(n=>n.it.id),[...m.G.items,...m.G.planned].map(n=>n.id),'full atlas node inventory');
  const inventory=new Set(m.nodes.map(n=>n.it.id)),expectedEdges=[...m.G.items,...m.G.planned].flatMap(n=>[...(n.deps||[]),...(n.pdeps||[])].filter(id=>inventory.has(id)).map(id=>[id,n.id])),actualEdges=m.edges.map(([a,b])=>[a.it.id,b.it.id]);same(actualEdges,expectedEdges,'full independent endpoint reconstruction');
  const labels=new WeakMap(),oldGroup=s.group,oldUnion=e.union,unions=[];
  s.group=function(model,key,...rest){const g=oldGroup.call(this,model,key,...rest);labels.set(g,key);return g;};
  e.union=function(model,groups,view){
   let current=null;const captures=[],oldBind=e.bind,oldClear=gl.clear,oldInstanced=gl.drawArraysInstanced,oldDraw=gl.drawArrays;
   const state=()=>({scissor:[...gl.getParameter(gl.SCISSOR_BOX)],viewport:[...gl.getParameter(gl.VIEWPORT)],scissorEnabled:gl.isEnabled(gl.SCISSOR_TEST),maskFramebuffer:gl.getParameter(gl.FRAMEBUFFER_BINDING)===e.mask.framebuffer,defaultFramebuffer:gl.getParameter(gl.FRAMEBUFFER_BINDING)===null,blend:gl.getParameter(gl.BLEND_EQUATION_RGB)});
   e.bind=function(model,g,...args){current=g;try{return oldBind.call(this,model,g,...args);}finally{current=null;}};
   gl.clear=function(bits){captures.push({kind:'clear',bits,...state()});return oldClear.call(this,bits);};
   gl.drawArraysInstanced=function(...args){fail(current,'unassociated instance submission');captures.push({kind:'instances',group:labels.get(current),args,...state(),maskOnly:gl.getUniform(e.program,e.location(e.program,'maskOnly')),count:current.count});return oldInstanced.apply(this,args);};
   gl.drawArrays=function(...args){captures.push({kind:'composite',args,...state(),box:[...gl.getUniform(e.composite,e.location(e.composite,'box'))]});return oldDraw.apply(this,args);};
   let returned;try{returned=oldUnion.call(this,model,groups,view);}finally{e.bind=oldBind;gl.clear=oldClear;gl.drawArraysInstanced=oldInstanced;gl.drawArrays=oldDraw;}
   // Independent tile enumeration: visit every viewport tile, then intersect each group rectangle.
   const W=Math.round(view.width*view.dpr),H=Math.round(view.height*view.dpr),mw=e.mask.width,mh=e.mask.height,expected=[],rows=[];
   for(const g of groups){const pad=5*g.width+2,b=g.bounds;const R=b?[Math.max(0,Math.floor((view.k*b[0]+view.tx-pad)*view.dpr)),Math.max(0,Math.floor((view.k*b[1]+view.ty-pad)*view.dpr)),Math.min(W,Math.ceil((view.k*b[2]+view.tx+pad)*view.dpr)),Math.min(H,Math.ceil((view.k*b[3]+view.ty+pad)*view.dpr))]:[0,0,W,H];let area=0,tiles=0;
    for(let ty=0;ty<Math.ceil(H/mh);ty++)for(let tx=0;tx<Math.ceil(W/mw);tx++){let x=tx*mw,y=ty*mh,L=Math.max(R[0],x),T=Math.max(R[1],y),D=Math.min(R[3],y+mh),B=Math.min(R[2],x+mw);if(B<=L||D<=T)continue;let w=B-L,h=D-T;area+=w*h;tiles++;expected.push({local:[L-x,mh-(D-y),w,h],screen:[L,H-D,w,h],box:[L/view.dpr,T/view.dpr,w/view.dpr,h/view.dpr],style:labels.get(g),count:g.count});}
    fail(area===Math.max(0,R[2]-R[0])*Math.max(0,R[3]-R[1]),'tile partition area');rows.push({style:labels.get(g),segments:g.count,tiles,area,rectangle:R,bounds:g.bounds,width:g.width});
   }
   fail(captures.length===expected.length*3,'one clear, instanced draw and composite per tile');let submitted=0;
   expected.forEach((x,i)=>{let[a,b,c]=captures.slice(i*3,i*3+3);same([a.kind,b.kind,c.kind],['clear','instances','composite'],'operation order');for(const z of[a,b,c])fail(z.scissorEnabled,'scissor disabled');same(a.scissor,x.local,'clear scissor');same(b.scissor,x.local,'coverage scissor');same(c.scissor,x.screen,'composition scissor');same(a.viewport,[0,0,mw,mh],'clear viewport');same(b.viewport,[0,0,mw,mh],'coverage viewport');same(c.viewport,[0,0,W,H],'composition viewport');fail(a.maskFramebuffer&&b.maskFramebuffer&&c.defaultFramebuffer,'framebuffer binding');fail(a.bits===gl.COLOR_BUFFER_BIT&&b.blend===gl.MAX&&c.blend===gl.FUNC_ADD,'clear/blend semantics');same(b.args,[gl.TRIANGLE_STRIP,0,4,x.count],'actual instance count');fail(b.maskOnly===true||b.maskOnly===1,'coverage maskOnly');same(c.args,[gl.TRIANGLE_STRIP,0,4],'actual composite quad');same(c.box,x.box,'actual composite box uniform');fail(b.group===x.style,'style association');submitted+=b.args[3];});
   fail(!gl.isEnabled(gl.SCISSOR_TEST),'union scissor cleanup');unions.push({rows,mask:[mw,mh],tileDraws:expected.length,actualInstanceSubmissions:submitted,logicalClearPixels:rows.reduce((a,b)=>a+b.area,0),logicalCompositePixels:rows.reduce((a,b)=>a+b.area,0),actualGLRecords:captures.length});return returned;
  };
  try{{const drawn=s.draw();fail(drawn===true,'isolated scene draw: '+s.status)};fail(gl.getError()===gl.NO_ERROR,'GL error');}finally{s.group=oldGroup;e.union=oldUnion;}
  const rows=unions.flatMap(x=>x.rows);return{width:m.W,height:m.H,dpr:m.dpr,k:m.k,tx:m.tx,ty:m.ty,selected,fields:[...m.show.fields],definitions:m.show.defs,planned:m.show.planned,nodes:m.nodes.length,edges:m.edges.length,nodeIDs:m.nodes.map(n=>n.it.id),edgeIDs:actualEdges,unions,totals:{activeStyleGroups:rows.length,uniqueGroupSegments:rows.reduce((a,b)=>a+b.segments,0),submittedSegmentInstances:unions.reduce((a,b)=>a+b.actualInstanceSubmissions,0),clearPixels:unions.reduce((a,b)=>a+b.logicalClearPixels,0),compositePixels:unions.reduce((a,b)=>a+b.logicalCompositePixels,0),tileDraws:unions.reduce((a,b)=>a+b.tileDraws,0)}};
 },selected);
 result.nodeIDsHash=hash(JSON.stringify(result.nodeIDs));result.edgeIDsHash=hash(JSON.stringify(result.edgeIDs));delete result.nodeIDs;delete result.edgeIDs;
 const original=producer.results.find(r=>r.width===result.width&&r.selected===result.selected);for(const k of['nodes','edges','width','height','dpr','k','tx','ty','nodeIDsHash','edgeIDsHash'])assert.deepEqual(result[k],original[k],k);assert.deepEqual(result.totals,original.totals);const rows=result.unions.flatMap(x=>x.rows),before=original.calls.flatMap(x=>x.groups);assert.equal(rows.length,before.length);rows.forEach((r,i)=>{for(const k of['style','segments','tiles','rectangle','bounds','width'])assert.deepEqual(r[k],before[i][k]);assert.equal(r.area,before[i].clearPixels);assert.equal(r.area,before[i].compositePixels);});results.push(result);console.log(`PASS ${width} selected=${selected}: actual clear/instanced/composite GL correspondence and full census reproduced`);
 }
 }finally{await page.close();}}
 await writeFile(output,JSON.stringify({complete:true,scope:'Independent four-state operation census only. No timing, FPS, pixel correctness, conservative-bound proof or production acceptance.',candidate:'6fd9268b4032ea38024b54f5a820806bd920d06b',browser:browser.version(),hashes,results},null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r));}
