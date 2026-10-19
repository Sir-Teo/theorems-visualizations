import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser,installBrowserAssets} from '../scripts/browser.mjs';
const dir='/tmp/atlas-xtal-glide';mkdirSync(dir,{recursive:true});const server=createServer({verificationAssets:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true}),results=[];
try{
 for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width:1180,height:1100}});await installBrowserAssets(page.context(),{local:true});const errors=[],states=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(`http://127.0.0.1:${server.address().port}/tools/harness.html?file=content/xtal/ch03.js&id=xtal-3.6&theme=${theme}&w=1080&wait=100`);await page.waitForFunction(()=>window.__done);const done=await page.evaluate(()=>window.__done);assert.equal(done.ok,true);assert.equal(done.renderer,'KaTeX 0.16.11');assert.deepEqual(done.errors,[]);assert.deepEqual(done.texErrors,[]);
   const settle=async()=>{await page.waitForTimeout(180);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));};
   const snap=async(label,k=null)=>{
    await settle();const r=await page.evaluate(()=>{const s=window.__vizStages[0];return{blank:window.__inspectCanvases(),errors:window.__vizErrors||[],tex:window.__texErrors||[],readout:document.querySelector('.viz-readout').textContent,points:window.__glidePoints||[],arrows:window.__glideArrows||[],width:s.width,height:s.height};});
    assert.deepEqual(r.blank,[]);assert.deepEqual(r.errors,[]);assert.deepEqual(r.tex,[]);assert.doesNotMatch(r.readout,/NaN|Infinity|undefined/);
    if(k!==null){assert.equal(r.points.length,k+1,label);assert.equal(r.arrows.length,k,label);assert.match(r.readout,new RegExp(`After ${k} application`));for(const p of [...r.points,...r.arrows.flat()]){assert.ok(p[0]>=9&&p[0]<=r.width-9,`${label}: x${p[0]}`);assert.ok(p[1]>=9&&p[1]<=r.height-9,`${label}: y${p[1]}`);}}
    const shot=`${dir}/xtal-3.6-${theme}-${String(states.length).padStart(2,'0')}.png`;await page.locator('#shot').screenshot({path:shot});states.push({label,...r,screenshot:shot,sha256:createHash('sha256').update(readFileSync(shot)).digest('hex')});
   };
   await snap('default screw reference');
   await page.evaluate(()=>{const s=window.__vizStages[0],set=s.setView.bind(s),dot=s.dot.bind(s),arrow=s.arrow.bind(s);s.setView=(...a)=>{window.__glidePoints=[];window.__glideArrows=[];return set(...a);};s.dot=(x,y,...a)=>{window.__glidePoints.push([s.X(x),s.Y(y)]);return dot(x,y,...a);};s.arrow=(x,y,z,w,...a)=>{window.__glideArrows.push([[s.X(x),s.Y(y)],[s.X(z),s.Y(w)]]);return arrow(x,y,z,w,...a);};});
   const choose=async(group,name)=>{await page.getByRole('group',{name:group,exact:true}).getByRole('button',{name,exact:true}).click();await settle();};
   await choose('operation','glide plane');
   for(const label of ['m (mirror)','a','c','n','d']){
    await choose('glide',label);const slider=page.getByRole('slider',{name:'applications k'});
    for(const k of [0,1,8,12]){await slider.focus();await slider.press('Home');for(let j=0;j<k;j++)await slider.press('ArrowRight');assert.equal(await slider.inputValue(),String(k));await snap(`${label}: k${k}`,k);}
    if(label==='c'||label==='n'){const canvas=page.locator('#viz canvas').first(),b=await canvas.boundingBox();await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.5+90,b.y+b.height*.5-45,{steps:8});await page.mouse.up();await snap(`${label}: k12 after native camera drag`,12);}
   }
   await choose('operation','screw axis');await snap('screw reference restored');assert.equal(await page.locator('#viz canvas:visible').count(),3);assert.match(states.at(-1).readout,/yes ✓/);assert.deepEqual(errors,[]);
   results.push({id:'xtal-3.6',theme,renderer:done.renderer,sourceFileHash:createHash('sha256').update(readFileSync('content/xtal/ch03.js')).digest('hex'),states});
  }finally{await page.close();}
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
writeFileSync(`${dir}/native-controls.json`,JSON.stringify(results,null,2));console.log(results.map(r=>({id:r.id,theme:r.theme,states:r.states.length})));
