// Owned TECH7 instrumentation; production modules are fulfilled from guarded raw sources.
import fs from'node:fs';import assert from'node:assert/strict';
import {installLingGlyphMasks} from './wave6-ling-glyph.shared.mjs';
export async function installTechProbe(page){
 await page.addInitScript(installLingGlyphMasks);
 await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const t=new URL(location.href).searchParams.get('qaTheme');if(t)localStorage.setItem('theme',t);});
 await page.route('**/content/tech/ch07.viz.js',async route=>{
  let source=fs.readFileSync(new URL('../content/tech/ch07.viz.js',import.meta.url),'utf8');const needle="import * as H from './ch07.shared.js';";assert.ok(source.includes(needle));
  source=source.replace(needle,`import * as TechModels from './ch07.shared.js';
   const H=Object.fromEntries(Object.entries(TechModels).map(([name,fn])=>[name,(...args)=>{const result=fn(...args);(window.__tech7Calls||=[]).push({name,args,result});return result;}]));`);
  await route.fulfill({contentType:'text/javascript',body:source});
 });
 await page.route('**/content/tech/ch07.viz.shared.js',async route=>{
  let source=fs.readFileSync(new URL('../content/tech/ch07.viz.shared.js',import.meta.url),'utf8');for(const[a,b]of[
   ['view(s);const valid=','view(s);s.__techChart={series,xr,yr,xlabel,ylabel,dots,area,areaColor};const valid='],
   ['view(s);const min=','view(s);s.__techBars={rows,unit,foot};const min=']
  ]){assert.equal(source.split(a).length,2,a);source=source.replace(a,b);}await route.fulfill({contentType:'text/javascript',body:source});
 });
 await page.route('**/assets/js/viz/core.js',async route=>{
  let source=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8'),marker='try { vizFn(instance.api); }';assert.equal(source.split(marker).length,2);
  source=source.replace(marker,`window.__tech7Runtime=instance;
   const originalRender=instance.api.render;instance.api.render=fn=>originalRender((...a)=>{window.__tech7Calls=[];return fn(...a);});
   const originalStage=instance.api.stage;instance.api.stage=(...args)=>{const s=originalStage(...args),begin=s.begin.bind(s);
    const reset=()=>{s.__techGlyphs=[];s.__techPrimitives=[];s.__techChart=null;s.__techBars=null;};reset();s.begin=(...a)=>{reset();return begin(...a);};
    const fillText=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(str,x,y,...rest)=>{const c=s.ctx,ink=window.__lingGlyphBounds(String(str),c),T=c.getTransform(),d=s.canvas.width/s.W;if(ink){const p=[[x+ink.l,y+ink.t],[x+ink.r,y+ink.t],[x+ink.l,y+ink.b],[x+ink.r,y+ink.b]].map(([u,v])=>[(T.a*u+T.c*v+T.e)/d,(T.b*u+T.d*v+T.f)/d]);s.__techGlyphs.push({text:String(str),left:Math.min(...p.map(a=>a[0])),right:Math.max(...p.map(a=>a[0])),top:Math.min(...p.map(a=>a[1])),bottom:Math.max(...p.map(a=>a[1]))});}return fillText(str,x,y,...rest);};
    for(const method of['path','poly','line','arrow','dot','rect','circle']){const fn=s[method].bind(s);s[method]=(...a)=>{s.__techPrimitives.push({method,args:structuredClone(a)});return fn(...a);};}return s;
   };
   ${marker}`);await route.fulfill({contentType:'text/javascript',body:source});
 });
}
export async function captureTech(page){
 await page.locator('#viz').scrollIntoViewIfNeeded();await page.waitForFunction(()=>window.__tech7Runtime?.visible);
 await page.evaluate(async()=>{await document.fonts.ready;window.dispatchEvent(new Event('vizpause'));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.__tech7Runtime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));});
 return page.evaluate(()=>{
  const rt=window.__tech7Runtime,issues=[];
  if(rt.dead||(window.__vizErrors||[]).length)issues.push({type:'draw failure',errors:window.__vizErrors});if((window.__texErrors||[]).length)issues.push({type:'strict TeX',errors:window.__texErrors});
  const stages=rt.stages.map((s,index)=>{for(const g of s.__techGlyphs)if(g.left<-.6||g.right>s.W+.6||g.top<-.6||g.bottom>s.H+.6)issues.push({type:'canvas glyph clipped',stage:index,...g,width:s.W,height:s.H});for(let i=0;i<s.__techGlyphs.length;i++)for(let j=i+1;j<s.__techGlyphs.length;j++){const a=s.__techGlyphs[i],b=s.__techGlyphs[j],w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(w>1&&h>1)issues.push({type:'canvas glyph overlap',stage:index,a:a.text,b:b.text,overlap:[w,h]});}
   const bytes=s.ctx.getImageData(0,0,s.canvas.width,s.canvas.height).data;let painted=0;for(let j=3;j<bytes.length;j+=4)if(bytes[j]>20)painted++;if(painted<30)issues.push({type:'blank canvas',stage:index});return{width:s.W,height:s.H,view:{x:s.xr,y:s.yr},scale:[s.sx,s.sy],glyphs:s.__techGlyphs,primitives:s.__techPrimitives,chart:s.__techChart,bars:s.__techBars,painted};
  });
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout,.stage-title,.refs-inline,.ctl-label,.ctl-value,.viz-legend')){if(getComputedStyle(el).display==='none'||!el.getClientRects().length)continue;const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1||r.top<b.top-1||r.bottom>b.bottom+1))issues.push({type:'rich ink',text:node.textContent,bounds:[r.left,r.top,r.right,r.bottom],container:[left,b.top,right,b.bottom]});}}
  for(const el of document.querySelectorAll('.katex-display')){const b=el.getBoundingClientRect(),inner=el.querySelector('.katex-html')?.getBoundingClientRect();if(el.scrollWidth>el.clientWidth+1||inner&&(inner.left<b.left-1||inner.right>b.right+1))issues.push({type:'inner math',text:el.textContent});}
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push({type:'page overflow'});
  return{issues,stages,calls:window.__tech7Calls||[],state:rt.state.capture(),readout:document.querySelector('.viz-readout')?.textContent,theme:document.documentElement.dataset.theme,controls:[...document.querySelectorAll('#viz input[type=range]')].map(e=>({label:e.getAttribute('aria-label'),value:Number(e.value)}))};
 });
}
