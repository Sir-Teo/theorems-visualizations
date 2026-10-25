// Initial actual-pixel preview. Full native/Share/scientific gates remain open.
import fs from 'node:fs';
import {chromium} from 'playwright-core';
import {createServer} from '../scripts/serve.mjs';
import {findBrowser} from '../scripts/browser.mjs';
const output=process.env.ROBOT_SHOTS||'/tmp/wave6-robot-preview';fs.mkdirSync(output,{recursive:true});
const server=createServer();await new Promise(r=>server.listen(0,r));
const browser=await chromium.launch({executablePath:findBrowser(),headless:true});
const page=await browser.newPage({viewport:{width:320,height:1100},deviceScaleFactor:1});
const errors=[],rows=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const theme=new URL(location.href).searchParams.get('qaTheme');if(theme)localStorage.setItem('theme',theme);});
await page.route('**/assets/js/viz/core.js',async route=>{
 let src=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
 const needle='try { vizFn(instance.api); }';
 if(!src.includes(needle))throw Error('runtime injection marker missing');
 src=src.replace(needle,`window.__robotRuntime=instance;
 for(const name of ['stage','stage3d']){const old=instance.api[name];instance.api[name]=(...args)=>{
  const s=old(...args),draw=s.ctx.fillText.bind(s.ctx),begin=s.begin.bind(s);s.__glyphs=[];
  s.begin=(...a)=>{s.__glyphs=[];return begin(...a);};
  s.ctx.fillText=(str,x,y,...rest)=>{const c=s.ctx,m=c.measureText(String(str)),T=c.getTransform(),d=s.canvas.width/s.W,box=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxDescent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxDescent]].map(([u,v])=>[(T.a*u+T.c*v+T.e)/d,(T.b*u+T.d*v+T.f)/d]);s.__glyphs.push({text:String(str),l:Math.min(...box.map(p=>p[0])),r:Math.max(...box.map(p=>p[0])),t:Math.min(...box.map(p=>p[1])),b:Math.max(...box.map(p=>p[1])),W:s.W,H:s.H});return draw(str,x,y,...rest);};
  return s;
 };}
 ${needle}`);
 await route.fulfill({contentType:'text/javascript',body:src});
});
try{
 for(const theme of['light','dark'])for(const width of(process.env.ROBOT_WIDTHS||'320,1200').split(',').map(Number))for(const item of(process.env.ROBOT_ITEMS||'1,2,3,4,5,6,7,8,9').split(',').map(Number)){
  await page.setViewportSize({width,height:1200});
  const url=`http://127.0.0.1:${server.address().port}/index.html?qaTheme=${theme}#/t/robot-6.${item}`;
  await page.goto(url,{waitUntil:'load'});await page.locator('#viz canvas').first().waitFor();
  await page.evaluate(async()=>{await document.fonts.ready;const r=window.__robotRuntime;r.playing=false;r.t=0;r.frame();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
  const audit=await page.evaluate(()=>{
   const rt=window.__robotRuntime,issues=[];
   for(const[stage,s]of rt.stages.entries())for(const el of s.overlay.querySelectorAll('.tex-label')){
    if(getComputedStyle(el).display==='none')continue;const b=el.getBoundingClientRect(),p=s.overlay.getBoundingClientRect();
    if(b.width&&(b.left<p.left-1||b.right>p.right+1||b.top<p.top-1||b.bottom>p.bottom+1))issues.push({type:'overlay',stage,text:el.textContent,bounds:[b.left-p.left,b.top-p.top,b.right-p.left,b.bottom-p.top],canvas:[p.width,p.height]});
   }
   for(const[stage,s]of rt.stages.entries())for(const g of s.__glyphs)if(g.l< -1||g.r>g.W+1||g.t< -1||g.b>g.H+1)issues.push({type:'canvas glyph',stage,...g});
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
   const clip=await page.locator(selector).evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});
   await page.screenshot({path:`${output}/${item}-${theme}-${width}-${label}.png`,clip,fullPage:true});
  };
  await capture('#viz','widget');
  for(const[selector,label]of[['.statement','statement'],['#idea','idea'],['#caption','caption'],['.refs-inline','refs']])if(await page.locator(selector).count())await capture(selector,label);
  if(await page.evaluate(()=>document.documentElement.dataset.theme)!==theme)throw Error('actual production theme differs');
  rows.push({item,theme,width,...audit});console.log(JSON.stringify({item,theme,width,stages:audit.stages,issues:audit.issues.length}));
 }
 fs.writeFileSync(output+'/summary.json',JSON.stringify({previewOnly:true,errors,rows},null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r));}
