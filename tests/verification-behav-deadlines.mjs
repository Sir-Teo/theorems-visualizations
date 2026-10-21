import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from '../scripts/serve.mjs';
import { findBrowser } from '../scripts/browser.mjs';

const server = createServer(); await new Promise(r => server.listen(0, r));
const browser = await chromium.launch({ executablePath: findBrowser(), headless: true });
const page = await browser.newPage(), errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/\/tools\/harness\.html\?/, async route => {
  const response = await route.fetch();
  let body = await response.text();
  body = body.replace('stats.stages++;', `stats.stages++;(window.__stages||=[]).push(s);const id=window.__stages.indexOf(s);for(const name of ['rect','line','textPx']){const f=s[name].bind(s);s[name]=(...a)=>{(window.__draws||=[]).push({id,name,a});return f(...a);};}`);
  body = body.replace('return item.viz(v);', `const render=v.render;v.render=fn=>render(()=>{window.__draws=[];fn();});return item.viz(v);`);
  await route.fulfill({ response, body });
});
const settle = () => page.waitForTimeout(50);
async function fill(i, value) { const input = page.locator('.ctl-slider input').nth(i); await input.fill(String(value)); await input.dispatchEvent('input'); await settle(); }
async function end(i, key) { await page.locator('.ctl-slider input').nth(i).press(key); await settle(); }
function ref(d, b, g) { let c=3;for(const w of d)if(w===4||w===8)c+=b;for(let i=0;i<3;i++)for(let j=0;j<i;j++)if(d[i]===d[j])c+=g;return c; }
async function check() {
  const p = await page.evaluate(() => ({
    values: [...document.querySelectorAll('.ctl-slider input')].map(e=>+e.value),
    bars: window.__draws.filter(x=>x.id===1&&x.name==='rect').map(x=>x.a),
    tasks: window.__draws.filter(x=>x.id===0&&x.name==='rect'&&x.a[4]?.fill==='accent').map(x=>x.a),
    handles: window.__stages[0].handles.map(h=>{const s=window.__stages[0];return {x:h.x,y:h.y,r:h.r,px:s.X(h.x),py:s.Y(h.y),clip:[s._m.l,s._m.t,s.width-s._m.r,s.height-s._m.b]};}),
    geometry: window.__draws.filter(x=>x.name!=='textPx').map(x=>{const s=window.__stages[x.id];return {id:x.id,name:x.name,p:[[x.a[0],x.a[1]],[x.a[2],x.a[3]]].map(([x,y])=>[s.X(x),s.Y(y)]),clip:[s._m.l,s._m.t,s.width-s._m.r,s.height-s._m.b]};}),
    labels: window.__draws.filter(x=>x.name==='textPx').map(({id,a:[str,X,Y,o={}]})=>{const s=window.__stages[id],c=s.ctx;c.save();c.font=s._font(o);c.textAlign=o.align||'left';c.textBaseline=o.baseline||'middle';const m=c.measureText(str);c.restore();const x=X+(o.dx||0),y=Y+(o.dy||0),h=o.halo===false?0:2;return {id,str,b:[x-m.actualBoundingBoxLeft-h,y-m.actualBoundingBoxAscent-h,x+m.actualBoundingBoxRight+h,y+m.actualBoundingBoxDescent+h],clip:[s._m.l,s._m.t,s.width-s._m.r,s.height-s._m.b]};}),
    overflow: document.documentElement.scrollWidth>innerWidth+1,
    tex: [...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.textContent),
    readout: document.querySelector('.viz-readout').textContent,
  }));
  assert.equal(p.overflow,false);assert.deepEqual(p.tex,[]);assert.doesNotMatch(p.readout,/NaN|Infinity|\\n/);
  const [b,g,d1,d2]=p.values, costs=[3+3*g,3+2*b,ref([d1,d2,12],b,g),3,3];
  assert.equal(p.bars.length,5);p.bars.forEach((a,i)=>{assert.equal(a[3],costs[i]);assert.equal(a[1],0);});
  assert.equal(p.tasks.length,3);assert.equal(p.handles[0].x,d1);assert.equal(p.handles[1].x,d2);assert.ok(Math.abs(p.handles[0].y-p.handles[1].y)>.5);
  const actual=p.tasks.map(a=>Math.round((a[0]+a[2])/2)).sort((a,b)=>a-b);assert.deepEqual(actual,[d1,d2,12].sort((a,b)=>a-b));
  for(const q of p.geometry)for(const [x,y]of q.p){assert.ok(Number.isFinite(x)&&Number.isFinite(y));assert.ok(x>=q.clip[0]-.5&&x<=q.clip[2]+.5&&y>=q.clip[1]-.5&&y<=q.clip[3]+.5,JSON.stringify(q));}
  for(const q of p.labels)assert.ok(q.b[0]>=q.clip[0]-.5&&q.b[1]>=q.clip[1]-.5&&q.b[2]<=q.clip[2]+.5&&q.b[3]<=q.clip[3]+.5,JSON.stringify(q));
  for(const h of p.handles){const r=h.r+6;assert.ok(h.px-r>=h.clip[0]&&h.py-r>=h.clip[1]&&h.px+r<=h.clip[2]&&h.py+r<=h.clip[3],JSON.stringify({hoverBounds:h}));for(const label of p.labels.filter(l=>l.id===0)){const dx=Math.max(label.b[0]-h.px,0,h.px-label.b[2]),dy=Math.max(label.b[1]-h.py,0,h.py-label.b[3]);assert.ok(Math.hypot(dx,dy)>r,JSON.stringify({labelHandleOverlap:label,handle:h}));}}
  for(let i=0;i<p.labels.length;i++)for(let j=0;j<i;j++){const a=p.labels[i],b=p.labels[j];if(a.id===b.id)assert.ok(a.b[2]<=b.b[0]||b.b[2]<=a.b[0]||a.b[3]<=b.b[1]||b.b[3]<=a.b[1],JSON.stringify({overlap:[a,b]}));}
}
async function drag(index, week) {
  const p=await page.evaluate(({index,week})=>{const s=window.__stages[0],h=s.handles[index],r=s.canvas.getBoundingClientRect();return {x:r.x+s.X(h.x),y:r.y+s.Y(h.y),to:r.x+s.X(week)};},{index,week});
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.to,p.y,{steps:8});await page.mouse.up();await settle();await check();assert.equal(+(await page.locator('.ctl-slider input').nth(index+2).inputValue()),week);
}
try {
  for(const theme of ['light','dark'])for(const width of [1450,430]) {
    await page.setViewportSize({width,height:1600});
    await page.goto(`http://localhost:${server.address().port}/tools/harness.html?file=content/behav/ch05-b.js&id=behav-5.8&still=1&theme=${theme}&w=${width-45}&wait=180`);
    await page.waitForFunction(()=>window.__done);const d=await page.evaluate(()=>window.__done);for(const k of ['errors','texErrors','blank'])assert.deepEqual(d[k],[]);
    await check();
    for(let mask=0;mask<16;mask++){for(let i=0;i<4;i++)await end(i,mask&(1<<i)?'End':'Home');await check();}
    for(const [a,b]of [[4,4],[8,8],[12,12],[1,1],[12,1],[1,12],[4,8],[1,2]]){await fill(2,a);await fill(3,b);await check();}
    await fill(2,12);await fill(3,12);await page.screenshot({path:`/tmp/atlas-behav-deadlines-${width}-${theme}.png`,fullPage:true});
    await drag(0,4);await drag(1,8);await check();
    for(let i=0;i<2;i++)await page.locator('.stage').nth(i).screenshot({path:`/tmp/atlas-behav-deadlines-${width}-${theme}-panel${i}.png`});
    console.log(`PASS deadlines ${width} ${theme}: all16 actual endpoint corners, eight same/cross/busy/optimal schedules, separate native drags, independent costs and full geometry/label/TeX containment`);
  }
  assert.deepEqual(errors,[]);
} finally {await browser.close();server.close();}
