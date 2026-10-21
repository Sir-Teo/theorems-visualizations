// Explicit-only bounded moving-picture comparisons against the complete uncached scene.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {findBrowser} from '../scripts/browser.mjs';
import {createServer} from '../scripts/serve.mjs';
import {retainedFixture} from '../scripts/lib/map-retained-fixture.mjs';
const fixture=await retainedFixture(),hashes=fixture.hashes,server=createServer();await new Promise(r=>server.listen(0,r));
const executablePath=findBrowser(),args=['--use-angle=metal'],browser=await chromium.launch({executablePath,headless:true,args}),results=[];
try{for(const theme of ['light','dark'])for(const dpr of [1,2]){
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:dpr,colorScheme:theme}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await fixture.route(page);
 try{await page.goto(`http://localhost:${server.address().port}/#/map`);await page.waitForFunction(()=>window.__mapAudit?.__scene?.status==='ready',null,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
 const result=await page.evaluate(async()=>{
  const m=window.__mapAudit,s=m.__scene,b=s.base,gl=s.gl,target=m.byId.get('ladr-2.30'),hover=m.byId.get('ladr-2.22'),pixelCount=Math.round(m.W*m.dpr)*Math.round(m.H*m.dpr),a=new Uint8Array(pixelCount*4),c=new Uint8Array(pixelCount*4),temp=document.createElement('canvas').getContext('2d'),pictures=[];
  const debug=gl.getExtension('WEBGL_debug_renderer_info'),renderer=gl.getParameter(debug?debug.UNMASKED_RENDERER_WEBGL:gl.RENDERER);
  const reference=document.createElement('canvas');reference.width=Math.round(m.W*m.dpr);reference.height=Math.round(m.H*m.dpr);reference.style.cssText='position:fixed;left:-10000px;top:-10000px;opacity:0;pointer-events:none';m.canvas.after(reference);const referenceContext=reference.getContext('2d');
  m.userMoved=true;m.finishZoom();m.hover=null;m.select(null,false);await s.geometry('edges',4);cancelAnimationFrame(m._raf);m._raf=0;
  temp.fillStyle=getComputedStyle(document.documentElement).getPropertyValue('--c-bg');temp.fillRect(0,0,1,1);const bg=temp.getImageData(0,0,1,1).data;
  const compare=(focus,k,pan=false)=>{
   m.k=k;m.tx=m.W/2-target.x*k+.375+(pan?12.375:0);m.ty=m.H/2-target.y*k-.125-(pan?8.125:0);
   const hook=b.edges.union;b.edges.union=s.originalUnion;s.exactText=true;try{if(!b.draw())throw Error('Uncached GPU reference unavailable: '+s.status);}finally{s.exactText=false;}gl.readPixels(0,0,s.canvas.width,s.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,a);b.edges.union=hook;
   const before=s.resources().edgeCache,sourceK=s.cache.k;if(!s.draw())throw Error('Retained GPU unavailable: '+s.status);if(s.canvas.width!==Math.round(m.W*m.dpr))throw Error('Wrong GPU backing');gl.readPixels(0,0,s.canvas.width,s.canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,c);const after=s.resources().edgeCache;
   let sum=0,changed=0;for(let i=0;i<a.length;i+=4)for(let j=0;j<3;j++){const delta=Math.abs(a[i+j]+bg[j]*(1-a[i+3]/255)-c[i+j]-bg[j]*(1-c[i+3]/255));sum+=delta;if(delta>20)changed++;}
   const saved=m.ctx;m.ctx=referenceContext;try{m._paint();}finally{m.ctx=saved;}const expected=referenceContext.getImageData(0,0,reference.width,reference.height).data;let canvasSum=0,canvasChanged=0;// GL readPixels is bottom-up; native Canvas image data is top-down.
   for(let i=0;i<c.length;i+=4){const pixel=i/4,row=Math.floor(pixel/reference.width),q=((reference.height-1-row)*reference.width+pixel%reference.width)*4;for(let j=0;j<3;j++){const delta=Math.abs(expected[q+j]*expected[q+3]/255+bg[j]*(1-expected[q+3]/255)-c[i+j]-bg[j]*(1-c[i+3]/255));canvasSum+=delta;if(delta>20)canvasChanged++;}}
   pictures.push({focus,k,ratio:k/sourceK,interaction:pan?'fractional pan':'zoom',moving:!!(m.zooming||m.dragging),mean:sum/(pixelCount*3),changed:changed/(pixelCount*3),canvasDifference:{mean:canvasSum/(pixelCount*3),changed:canvasChanged/(pixelCount*3)},error:gl.getError(),cacheHit:after.hits>before.hits,cacheBuild:after.builds>before.builds,uncoveredPixels:after.uncoveredPixels,bytes:s.budget.bytes});
  };
  for(const focus of ['none','selected','selected-hover']){
   m.hover=null;m.select(null,false);if(focus!=='none'){target.it.st??='';m.select(target,false);}if(focus==='selected-hover'){hover.it.st??='';m.hover=hover;}
   m.zooming=false;m.k=.8;m.tx=m.W/2-target.x*.8+.375;m.ty=m.H/2-target.y*.8-.125;if(!s.draw())throw Error('Initial exact cache unavailable');
   m.dragging=true;compare(focus,.8,true);m.dragging=false;
   m.zooming=true;for(const k of [1,1.4,.5])compare(focus,k);
   // The ratio outside the reuse envelope must rebuild before being displayed.
   compare(focus,1.6);m.zooming=false;compare(focus,1.1);
  }
  reference.remove();return{renderer,pictures};
 });results.push({theme,dpr,...result});console.log(JSON.stringify({theme,dpr,...result}));
 for(const picture of result.pictures){assert.equal(picture.error,0);assert.ok(picture.mean<2&&picture.changed<.02,JSON.stringify(picture));assert.ok(picture.canvasDifference.mean<2&&picture.canvasDifference.changed<.02,JSON.stringify(picture));assert.ok(picture.bytes<=64_000_000);if(!picture.moving||picture.ratio<.75||picture.ratio>1.4)assert.ok(picture.cacheBuild,JSON.stringify(picture));else assert.ok(picture.cacheHit,JSON.stringify(picture));}
 await page.evaluate(()=>{const m=window.__mapAudit,s=m.__scene,n=m.byId.get('ladr-2.30');clearTimeout(m.zoomTimer);m.zooming=true;m.k=1.4;m.tx=m.W/2-n.x*m.k+.375;m.ty=m.H/2-n.y*m.k-.125;s.draw();});
 await page.screenshot({path:`/tmp/atlas-map-retained-moving-${theme}-dpr${dpr}.png`});
 const released=await page.evaluate(()=>{const m=window.__mapAudit,s=m.__scene;m.destroy();return s.budget.bytes;});assert.equal(released,0);assert.deepEqual(errors,[]);
 }finally{await page.close();}}
 await writeFile('/tmp/atlas-map-retained-motion.json',JSON.stringify({complete:true,date:new Date().toISOString(),executablePath,args,browser:browser.version(),hashes,method:'Full premultiplied RGBA readback composed over actual theme background; uncached exact-native-font scene and connected full Canvas direct paint versus retained scene at the identical moving transform and focus state. Native font labels and node layers are rendered live in both pictures. This bounds image error, not performance.',results},null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r));}
