// Actual-pixel default and complete rich-field capture; native controls are gated separately.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import chapter from '../content/demo/ch06.js';
import syllabus from '../content/demo/syllabus.js';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const output=process.env.DEMO_SHOTS||'/workspace/scratch/wave6-demo-research/preview-draft-v1';fs.mkdirSync(output,{recursive:true});
const sourceFiles=[...fs.readdirSync(new URL('../content/demo/',import.meta.url)).filter(p=>/^ch06(?:\.[a-z]+)*\.js$/.test(p)).map(p=>'../content/demo/'+p),'../content/demo/syllabus.js','../assets/js/viz/core.js','../assets/js/viz/math.js','../assets/js/share-state.js','../assets/js/app.js','../assets/css/style.css','../data/col/demo.json','../data/index.json','./wave6-demo-browser.mjs'];
const hashes=()=>Object.fromEntries(sourceFiles.map(p=>[p,createHash('sha256').update(fs.readFileSync(new URL(p,import.meta.url))).digest('hex')]));
const sourceHashes=hashes();
const shard=JSON.parse(fs.readFileSync(new URL('../data/col/demo.json',import.meta.url)));
for(const item of chapter.items){const outline=syllabus.chapters.find(c=>c.n===6).items.find(i=>i.num===item.num);assert.equal(outline.pic,item.caption,'caption mirror');assert.deepEqual(outline.refs,item.refs,'source mirror');assert.equal(shard['demo-'+item.num].st,item.statement,'built statement matches source');assert.deepEqual(shard['demo-'+item.num].refs,item.refs,'built references match source');}
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:320,height:1100},deviceScaleFactor:1});
const errors=[],rows=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';
 if(!src.includes(needle))throw Error('runtime injection marker missing');
 src=src.replace(needle,`window.__demoRuntime=instance;
 for(const name of ['stage','stage3d']){const old=instance.api[name];instance.api[name]=(...args)=>{
  const s=old(...args),draw=s.ctx.fillText.bind(s.ctx),begin=s.begin.bind(s);s.__glyphs=[];
  s.begin=(...a)=>{s.__glyphs=[];return begin(...a);};
  s.ctx.fillText=(str,x,y,...rest)=>{const c=s.ctx,m=c.measureText(String(str)),T=c.getTransform(),d=s.canvas.width/s.W,box=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x-m.actualBoundingBoxLeft,y+m.actualBoundingBoxDescent],[x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent]].map(([u,v])=>[(T.a*u+T.c*v+T.e)/d,(T.b*u+T.d*v+T.f)/d]);s.__glyphs.push({text:String(str),font:c.font,baseline:c.textBaseline,l:Math.min(...box.map(p=>p[0])),r:Math.max(...box.map(p=>p[0])),t:Math.min(...box.map(p=>p[1])),b:Math.max(...box.map(p=>p[1])),W:s.W,H:s.H,dataClip:s._clipped,g:s._m});return draw(str,x,y,...rest);};
  return s;
 };}
 ${needle}`);
 await route.fulfill({contentType:'text/javascript',body:src});
});
try{
 for(const theme of(process.env.DEMO_THEMES||'light,dark').split(','))for(const width of(process.env.DEMO_WIDTHS||'320,1200').split(',').map(Number))for(const item of(process.env.DEMO_ITEMS||'1,2,3,4,5,6,7,8,9,10,11,12').split(',').map(Number)){
  await page.setViewportSize({width,height:1200});
  const url=`http://127.0.0.1:${server.address().port}/index.html?qaTheme=${theme}#/t/demo-6.${item}`;
  await page.goto(url,{waitUntil:'load'});await page.locator('#viz canvas').first().waitFor();
  await page.locator('#viz').scrollIntoViewIfNeeded();
  await page.evaluate(async()=>{const r=window.__demoRuntime;r.playing=false;r.t=0;r.frame();const fonts=[...new Set(r.stages.flatMap(s=>s.__glyphs.map(g=>g.font)))];await Promise.all(fonts.map(f=>document.fonts.load(f)));await document.fonts.ready;r.frame();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));r.frame();});
  const audit=await page.evaluate(()=>{
   const rt=window.__demoRuntime,issues=[];if(rt.dead||(window.__vizErrors||[]).length)throw Error('Production draw failed: '+(window.__vizErrors||[]).join(' | '));
   for(const[stage,s]of rt.stages.entries())for(const el of s.overlay.querySelectorAll('.tex-label')){
    if(getComputedStyle(el).display==='none')continue;const b=el.getBoundingClientRect(),p=s.overlay.getBoundingClientRect();
    if(b.width&&(b.left<p.left-1||b.right>p.right+1||b.top<p.top-1||b.bottom>p.bottom+1))issues.push({type:'overlay',stage,text:el.textContent,bounds:[b.left-p.left,b.top-p.top,b.right-p.left,b.bottom-p.top],canvas:[p.width,p.height]});
   }
   for(const[stage,s]of rt.stages.entries())for(const g of s.__glyphs){if(g.l< -1||g.r>g.W+1||g.t< -1||g.b>g.H+1)issues.push({type:'canvas glyph',stage,...g});if(g.dataClip&&g.g&&(g.l<g.g.l-1||g.r>g.W-g.g.r+1||g.t<g.g.t-1||g.b>g.H-g.g.b+1))issues.push({type:'data glyph clipped',stage,...g});}
   for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout,.stage-title,.refs-inline')){
    const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1||r.top<b.top-1||r.bottom>b.bottom+1))issues.push({type:'rich ink',text:node.textContent,bounds:[r.left,r.top,r.right,r.bottom],container:[left,b.top,right,b.bottom]});}
   }
   for(const el of document.querySelectorAll('.katex-display')){const b=el.getBoundingClientRect(),inner=el.querySelector('.katex-html')?.getBoundingClientRect();if(el.scrollWidth>el.clientWidth+1||inner&&(inner.left<b.left-1||inner.right>b.right+1))issues.push({type:'inner math',text:el.textContent,scroll:el.scrollWidth,width:el.clientWidth});}
   if(document.documentElement.scrollWidth>window.innerWidth+1)issues.push({type:'page overflow',width:document.documentElement.scrollWidth});
   return{issues,stages:rt.stages.length,readout:document.querySelector('.viz-readout')?.innerText,state:rt.state.capture(),glyphs:rt.stages.map(s=>s.__glyphs)};
  });
  const capture=async(selector,label)=>{
   await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});});
   const clip=await page.locator(selector).evaluate((e,pad)=>{const b=e.getBoundingClientRect(),x=Math.max(0,b.x+scrollX-pad),y=Math.max(0,b.y+scrollY-pad);return{x,y,width:Math.min(document.documentElement.scrollWidth-x,b.width+2*pad),height:b.height+2*pad};},label==='widget'?0:2);
   await page.screenshot({path:`${output}/${item}-${theme}-${width}-${label}.png`,clip,fullPage:true});
  };
  await capture('#viz','widget');
  for(const[selector,label]of[['.statement','statement'],['#idea','idea'],['#caption','caption'],['.refs-inline','refs'],['.scope','scope']])if(await page.locator(selector).count())await capture(selector,label);
  if(await page.evaluate(()=>document.documentElement.dataset.theme)!==theme)throw Error('actual production theme differs');
  rows.push({item,theme,width,...audit});console.log(JSON.stringify({item,theme,width,stages:audit.stages,issues:audit.issues.length}));
 }
 if(JSON.stringify(hashes())!==JSON.stringify(sourceHashes))errors.push('Source changed during capture');
 const issues=rows.reduce((sum,r)=>sum+r.issues.length,0),status=errors.length||issues?'FAIL':'PASS';
 fs.writeFileSync(output+'/summary.json',JSON.stringify({status,scope:'Complete default widgets and rich fields; native controls gated separately',issues,errors,sourceHashes,rows},null,2)+'\n');
 if(status!=='PASS')throw Error(`Default/rich capture failed: ${errors.length} errors, ${issues} ink issues`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
