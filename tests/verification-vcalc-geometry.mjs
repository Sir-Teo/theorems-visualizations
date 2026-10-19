// Mathematical and pointer follow-up for change of variables and Pappus.
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:1200,height:1800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/,async route=>{
  const response=await route.fetch();
  const body=(await response.text()).replace('stats.stages++;',`stats.stages++;
    (window.__auditStages ||= []).push(s);
    const begin=s.begin.bind(s),poly=s.poly.bind(s),path=s.path.bind(s),line=s.line.bind(s);
    s.begin=()=>{s.__polys=[];s.__paths=[];s.__lines=[];return begin();};
    s.poly=(pts,st={})=>{s.__polys.push(pts.map(p=>Array.from(p)));return poly(pts,st);};
    s.path=(pts,st={})=>{s.__paths.push(pts.map(p=>p&&Array.from(p)));return path(pts,st);};
    s.line=(x,y,u,v,st={})=>{s.__lines.push([[x,y],[u,v]]);return line(x,y,u,v,st);};`)
    .replace('return item.viz(v);',`const scene=v.scene3;v.scene3=(...a)=>{const sc=scene(...a);window.__auditScene=sc;return sc;};return item.viz(v);`);
  await route.fulfill({response,body});
});
const open=async(id,theme)=>{await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/vcalc/ch04${id==='4.6'?'':'-b'}.js&id=vcalc-${id}&still=1&wait=100&theme=${theme}`);await page.waitForFunction(()=>window.__done);const r=await page.evaluate(()=>window.__done);assert.deepEqual(r.errors,[]);assert.deepEqual(r.texErrors,[]);};
const settle=()=>page.waitForTimeout(120);
const slider=async(i,key)=>{await page.locator('input[type=range]').nth(i).focus();await page.keyboard.press(key);await settle();};
const read=()=>page.locator('.viz-readout').innerText();
const state=()=>page.evaluate(()=>window.__auditStages.map(s=>({view:s.view,polys:s.__polys,paths:s.__paths,lines:s.__lines})));
const fit=s=>{for(const pts of [...s.polys,...s.lines])for(const [x,y] of pts)assert.ok(Number.isFinite(x)&&Number.isFinite(y)&&x>=s.view.x[0]-1e-12&&x<=s.view.x[1]+1e-12&&y>=s.view.y[0]-1e-12&&y<=s.view.y[1]+1e-12);};
const drag=async(i,x,y)=>{
  await page.locator('#viz canvas').first().scrollIntoViewIfNeeded();
  const p=await page.evaluate(({i,x,y})=>{const s=window.__auditStages[0],h=s.handles[i],b=s.canvas.getBoundingClientRect();return{x0:b.x+s.X(h.x),y0:b.y+s.Y(h.y),x:b.x+s.X(x),y:b.y+s.Y(y)};},{i,x,y});
  await page.mouse.move(p.x0,p.y0);await page.mouse.down();await page.mouse.move(p.x,p.y,{steps:6});await page.mouse.up();await settle();
};
try{
  for(const theme of ['light','dark']){
    await open('4.6',theme);
    for(let i=0;i<4;i++)for(let j=0;j<2;j++){
      await page.locator('.ctl-select button').nth(i).click();await page.locator('.ctl-select button').nth(4+j).click();await settle();
      for(const end of ['Home','End']){
        await slider(0,end);const stages=await state();fit(stages[1]);
        for(const pts of stages[2].paths)for(const p of pts)if(p)assert.ok(p[1]>=1e-6&&p[1]<=5);
        assert.match(await read(),/weighted relative error/);assert.doesNotMatch(await read(),/NaN|Infinity/);
      }
    }
    console.log(`PASS ${theme} change of variables: 16 map/integrand/grid states, full image and error curves`);
    await open('4.10',theme);
    for(let mode=0;mode<2;mode++){
      await page.locator('.ctl-select button').nth(mode).click();await settle();
      for(const end of ['Home','End']){
        await slider(0,end);fit((await state())[1]);
        assert.doesNotMatch(await read(),/NaN|Infinity/);
        assert.match(await read(),end==='Home'?/ratio.*1\.000/s:/straddles the axis/);
      }
    }
    // Rotate the actual scene using pointer input.
    const yaw=await page.evaluate(()=>window.__auditScene.yaw);
    const b=await page.locator('#viz canvas').nth(1).boundingBox();
    await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+60,b.y+b.height/2+30,{steps:6});await page.mouse.up();await settle();
    assert.notEqual(await page.evaluate(()=>window.__auditScene.yaw),yaw);fit((await state())[1]);
    // Crossing the boundary must hide undefined centroids; the same handles remain editable.
    await drag(0,3,1.8);assert.match(await read(),/simple polygon with nonzero area/);
    await drag(0,1,.2);assert.doesNotMatch(await read(),/Move the corners|NaN|Infinity/);
    // Move all corners to the other side of the axis; unsigned distances must still work.
    for(const [i,[x,y]] of [[1,.2],[2.5,.5],[2.9,1.6],[1.8,2.1],[1.1,1.2]].entries())await drag(i,.7*x-2,y);
    assert.match(await read(),/ratio.*1\.000/s);assert.doesNotMatch(await read(),/straddles|NaN|Infinity/);fit((await state())[1]);
    console.log(`PASS ${theme} Pappus: axis sides/crossing, both modes, rotation, self-crossing feedback and recovery`);
  }
  assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
