import fs from 'node:fs';
import assert from 'node:assert/strict';

export async function installArtProbe(page){
 await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const t=new URL(location.href).searchParams.get('qaTheme');if(t)localStorage.setItem('theme',t);});
 await page.route('**/content/art/ch06.viz.js',async route=>{
  let source=fs.readFileSync(new URL('../content/art/ch06.viz.js',import.meta.url),'utf8');
  const marker="import * as H from './ch06.shared.js';";assert.ok(source.includes(marker));
  source=source.replace(marker,`import*as actualH from './ch06.shared.js';
   const H=Object.fromEntries(Object.entries(actualH).map(([name,fn])=>[name,typeof fn==='function'&&Object.hasOwn(actualH.MODELS,name)?p=>{const result=fn(p);((window.__artModels??={})[name]??={})[JSON.stringify(p)]={parameters:structuredClone(p),result:structuredClone(result)};return result;}:fn]));`);
  await route.fulfill({contentType:'text/javascript',body:source});
 });
 await page.route('**/assets/js/viz/core.js',async route=>{
  let source=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
  const marker='try { vizFn(instance.api); }';assert.ok(source.includes(marker));
  source=source.replace(marker,`window.__artRuntime=instance;
   for(const kind of ['stage','stage3d']){const old=instance.api[kind];instance.api[kind]=(...args)=>{
    const s=old(...args),begin=s.begin.bind(s);s.__kind=kind;
    const reset=()=>{s.__paths=[];s.__polys=[];s.__lines=[];s.__arrows=[];s.__dots=[];s.__rects=[];s.__circles=[];s.__meshes=[];s.__glyphs=[];s.__paintedAxes=null;};reset();
    s.begin=(...a)=>{reset();return begin(...a);};
    if(kind==='stage'){const axes=s.axes.bind(s);s.axes=(...a)=>{s.__paintedAxes={bounds:s.bounds,yticks:s.o.yticks};return axes(...a);};}
    const fillText=s.ctx.fillText.bind(s.ctx),strokeText=s.ctx.strokeText.bind(s.ctx);
  const record=(str,x,y,isStroke)=>{const c=s.ctx,m=c.measureText(String(str)),T=c.getTransform(),d=s.canvas.width/s.W,box=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x-m.actualBoundingBoxLeft,y+m.actualBoundingBoxDescent],[x+m.actualBoundingBoxRight,y+m.actualBoundingBoxDescent]].map(([u,v])=>[(T.a*u+T.c*v+T.e)/d,(T.b*u+T.d*v+T.f)/d]),ex=isStroke?c.lineWidth/2*Math.hypot(T.a,T.c)/d:0,ey=isStroke?c.lineWidth/2*Math.hypot(T.b,T.d)/d:0;s.__glyphs.push({text:String(str),font:c.font,baseline:c.textBaseline,stroke:isStroke,l:Math.min(...box.map(p=>p[0]))-ex,r:Math.max(...box.map(p=>p[0]))+ex,t:Math.min(...box.map(p=>p[1]))-ey,b:Math.max(...box.map(p=>p[1]))+ey,W:s.W,H:s.H,dataClip:s._clipped,g:s._m});};
  s.ctx.fillText=(str,x,y,...rest)=>{record(str,x,y,false);return fillText(str,x,y,...rest);};
  s.ctx.strokeText=(str,x,y,...rest)=>{record(str,x,y,true);return strokeText(str,x,y,...rest);};
    for(const [method,key]of [['path','__paths'],['poly','__polys'],['line','__lines'],['arrow','__arrows'],['dot','__dots']]){const fn=s[method].bind(s);s[method]=(...a)=>{let points,style;if(method==='path'||method==='poly'){points=a[0];style=a[1]||{};}else if(kind==='stage3d'){points=method==='dot'?[a[0]]:[a[0],a[1]];style=a[method==='dot'?1:2]||{};}else{points=method==='dot'?[[a[0],a[1]]]:[[a[0],a[1]],[a[2],a[3]]];style=a[method==='dot'?2:4]||{};}s[key].push({points,style,pixels:points.map(p=>p?(kind==='stage3d'?s.project(p):[s.X(p[0]),s.Y(p[1])]):null)});return fn(...a);};}
    if(kind==='stage'){const circle=s.circle.bind(s);s.circle=(x,y,r,style={})=>{s.__circles.push({x,y,r,style});return circle(x,y,r,style);};const rect=s.rect.bind(s);s.rect=(...a)=>{s.__rects.push({points:[[a[0],a[1]],[a[2],a[3]]],style:a[4]||{}});return rect(...a);};}
    else{const surface=s.surface.bind(s);s.surface=(F,u,w,st={})=>{const mesh={points:[],style:st};s.__meshes.push(mesh);return surface((a,b)=>{const p=F(a,b);mesh.points.push(p);return p;},u,w,st);};}
    return s;
   };}
   ${marker}`);
  await route.fulfill({contentType:'text/javascript',body:source});
 });
}

export async function captureArt(page){
 await page.evaluate(async()=>{window.dispatchEvent(new Event('vizpause'));const rt=window.__artRuntime;rt.frame();const fonts=[...new Set(rt.stages.flatMap(s=>s.__glyphs.map(g=>g.font)))];await Promise.all(fonts.map(f=>document.fonts.load(f)));await document.fonts.ready;rt.frame();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));rt.frame();});
 return page.evaluate(()=>{
  const rt=window.__artRuntime,issues=[];if(rt.dead||(window.__vizErrors||[]).length)issues.push({type:'production draw failure',errors:window.__vizErrors});
  const pack=x=>typeof x==='bigint'?x.toString():Array.isArray(x)?x.map(pack):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,pack(v)])):x;
  const stages=rt.stages.map((s,j)=>{
   for(const g of s.__glyphs){if(g.l< -1||g.r>s.W+1||g.t< -1||g.b>s.H+1)issues.push({type:'canvas ink',stage:j,g,W:s.W,H:s.H});if(g.dataClip&&g.g&&(g.l<g.g.l-1||g.r>s.W-g.g.r+1||g.t<g.g.t-1||g.b>s.H-g.g.b+1))issues.push({type:'data glyph clipped',stage:j,g,W:s.W,H:s.H});}
   for(const el of s.overlay.querySelectorAll('.tex-label')){if(getComputedStyle(el).display==='none')continue;const b=el.getBoundingClientRect(),p=s.overlay.getBoundingClientRect();if(b.width&&(b.left<p.left-1||b.right>p.right+1||b.top<p.top-1||b.bottom>p.bottom+1))issues.push({type:'overlay box',stage:j,text:el.textContent});const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>1&&(r.left<p.left-1||r.right>p.right+1||r.top<p.top-1||r.bottom>p.bottom+1))issues.push({type:'overlay ink',stage:j,text:node.textContent});}}
   const geometries=[...s.__paths,...s.__polys,...s.__lines,...s.__arrows,...s.__dots,...s.__meshes];
   for(const geometry of geometries)for(const p of geometry.points){if(!p)continue;if(!p.every(Number.isFinite)){issues.push({type:'nonfinite geometry',stage:j,p});continue;}const pixel=s.__kind==='stage3d'?s.project(p):[s.X(p[0]),s.Y(p[1])];if(pixel[0]< -1||pixel[0]>s.W+1||pixel[1]< -1||pixel[1]>s.H+1)issues.push({type:'canvas geometry',stage:j,p,pixel,canvas:[s.W,s.H]});}
   if(s.__kind==='stage'){
    if(s.o.axes&&JSON.stringify(s.__paintedAxes?.bounds)!==JSON.stringify(s.bounds))issues.push({type:'axis/data view mismatch',stage:j,painted:s.__paintedAxes?.bounds,final:s.bounds});
    for(const path of s.__paths)for(let k=0;k<path.points.length;k++){const p=path.points[k],at=path.pixels[k];if(p&&at&&(Math.abs(at[0]-s.X(p[0]))>1e-7||Math.abs(at[1]-s.Y(p[1]))>1e-7))issues.push({type:'paint transform drift',stage:j});}
    const g=s.o.gutter?s._m:{l:0,r:0,t:0,b:0};
    for(const a of [...s.__paths,...s.__lines]){if(a.style.stroke===false)continue;const pad=(a.style.width??2)/2;for(const p of a.points){if(!p)continue;const x=s.X(p[0]),y=s.Y(p[1]);if(x-pad<g.l-1||x+pad>s.W-g.r+1||y-pad<g.t-1||y+pad>s.H-g.b+1)issues.push({type:'full stroke ink',stage:j,p,pad});}}
    for(const a of s.__rects){const xs=a.points.map(p=>s.X(p[0])),ys=a.points.map(p=>s.Y(p[1])),pad=a.style.stroke===false?0:(a.style.width??2)/2;if(Math.min(...xs)-pad<g.l-1||Math.max(...xs)+pad>s.W-g.r+1||Math.min(...ys)-pad<g.t-1||Math.max(...ys)+pad>s.H-g.b+1)issues.push({type:'rectangle ink',stage:j,a});}
    for(const a of s.__circles){const x=s.X(a.x),y=s.Y(a.y),rx=Math.abs(a.r*s.sx),ry=Math.abs(a.r*s.sy),pad=a.style.stroke===false?0:(a.style.width??2)/2;if(x-rx-pad<g.l-1||x+rx+pad>s.W-g.r+1||y-ry-pad<g.t-1||y+ry+pad>s.H-g.b+1)issues.push({type:'circle ink',stage:j,a});}
    for(const dot of s.__dots){const p=dot.points[0],x=s.X(p[0]),y=s.Y(p[1]),r=(dot.style.r??4)+1;if(x-r<g.l-1||x+r>s.W-g.r+1||y-r<g.t-1||y+r>s.H-g.b+1)issues.push({type:'marker ink',stage:j,p,r});}
    for(const a of s.__arrows){const P=a.points.map(p=>[s.X(p[0]),s.Y(p[1])]),dx=P[1][0]-P[0][0],dy=P[1][1]-P[0][1],L=Math.hypot(dx,dy);if(L<.5)continue;const u=dx/L,v=dy/L,h=Math.min(a.style.head??9,L*.45),pad=(a.style.width??2)/2,points=[...P,[P[1][0]-u*h-v*h*.45,P[1][1]-v*h+u*h*.45],[P[1][0]-u*h+v*h*.45,P[1][1]-v*h-u*h*.45]];for(const[x,y]of points)if(x-pad<g.l-1||x+pad>s.W-g.r+1||y-pad<g.t-1||y+pad>s.H-g.b+1)issues.push({type:'arrow ink',stage:j,points});}
   }
   return pack({kind:s.__kind,W:s.W,H:s.H,axes:s.o.axes,xlog:!!s.o.xlog,ylog:!!s.o.ylog,sx:s.sx,sy:s.sy,bounds:s.bounds,xticks:s.o.xticks,yticks:s.o.yticks,paintedAxes:s.__paintedAxes,paths:s.__paths,polys:s.__polys,lines:s.__lines,arrows:s.__arrows,dots:s.__dots,rects:s.__rects,circles:s.__circles,meshes:s.__meshes,glyphs:s.__glyphs,ledger:s.__artLedger,facts:s.__artFacts,bars:s.__artBars,matrix:s.__artMatrix});
  });
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout,.stage-title,.refs-inline,.viz-controls .ctl,.viz-legend .lg-item')){const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1||r.top<b.top-1||r.bottom>b.bottom+1))issues.push({type:'rich ink',text:node.textContent,bounds:[r.left,r.top,r.right,r.bottom],container:[left,b.top,right,b.bottom]});}}
  for(const el of document.querySelectorAll('.katex-display')){const b=el.getBoundingClientRect(),inner=el.querySelector('.katex-html')?.getBoundingClientRect();if(el.scrollWidth>el.clientWidth+1||inner&&(inner.left<b.left-1||inner.right>b.right+1))issues.push({type:'inner math',text:el.textContent});}
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push({type:'page overflow'});
  const state=rt.state.capture(),controls=[...document.querySelectorAll('#viz input[type=range]')].map(e=>({label:e.getAttribute('aria-label'),value:Number(e.value),min:Number(e.min),max:Number(e.max),step:Number(e.step)}));
  const palette=Object.fromEntries(['teal','blue','orange','gold','purple'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--c-'+k).trim()]));
  return{issues,state,controls,stages,palette,models:pack(window.__artModels),readout:document.querySelector('.viz-readout')?.innerText,theme:document.documentElement.dataset.theme,drawErrors:[...document.querySelectorAll('.viz-error')].map(e=>e.innerText)};
 });
}

export async function artScreenshot(page,file){
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});});
 const bounds=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});
 await page.screenshot({path:file,clip:bounds,fullPage:true});
 const regions=await page.locator('#viz').evaluate(host=>{const b=host.getBoundingClientRect();return Object.fromEntries(['.viz-stages','.viz-legend','.viz-controls','.viz-readout'].map(selector=>{const r=host.querySelector(selector)?.getBoundingClientRect();return[selector,r?{x:r.x-b.x,y:r.y-b.y,width:r.width,height:r.height}:null];}));});
 fs.writeFileSync(file.replace('.png','.regions.json'),JSON.stringify(regions,null,2)+'\n');
}

export async function artPixels(page,id){
 return page.evaluate(id=>{
  const rt=window.__artRuntime,out=[];
  const add=(stage,x,y,tag)=>{const s=rt.stages[stage],px=Math.floor(s.X(x)),py=Math.floor(s.Y(y));if(px<0||py<0||px>=s.W||py>=s.H)return;out.push({stage,tag,px,py,x:s.invX(px+.5),y:s.invY(py+.5),rgba:[...s.ctx.getImageData(px,py,1,1).data]});};
  const row=(stage,y,tag)=>{const s=rt.stages[stage];for(let i=1;i<80;i++)add(stage,s.invX(s.W*i/80),y,tag);};
  const patches=(stage,n,tag)=>{const w=8.7/n;for(let i=0;i<n;i++)add(stage,.65+i*w+(w-.16)/2,4.5,tag+'-'+i);};
  if(id===1)row(0,1.8,'input');
  if(id===2)row(0,3.6,'input');
  if([3,4,14].includes(id)){for(const stage of[0,...(id!==14?[1]:[])])for(let i=0;i<2;i++){add(stage,2.65+4.7*i,4,'target-'+i);add(stage,1+4.7*i,6,'ground-'+i);}if(id===14)patches(1,2,'preview');}
  if(id===5){for(let j=0;j<2;j++)for(let i=1;i<80;i++)add(0,2.65+4.7*j,1.3+5.95*i/80,'stripe-'+j);patches(2,3,'pool');}
  if(id===6){for(let stage=0;stage<3;stage++){for(const x of[.6,1.8,3.1,4.45,5.7,6.8,8.1,9.3])for(const y of[1.7,2.4,3.3,4.4,5.2,6.5])add(stage,x,y,'scene');for(let i=0;i<6;i++)add(stage,1.1+1.5*i,1.08,'chip-'+i);}}
  if(id===7)patches(1,2,'preview');
  if(id===8){const edges=[[.4,2.2,5.5,7.3,9.6],[.4,3.5,5,8,9.6],[.4,1.9,4.6,6.4,9.6]],ys=[1,3.1,5.2,7.3];for(const stage of[0,1])for(let i=0;i<12;i++){const r=Math.floor(i/4),c=i%4;add(stage,(edges[r][c]+edges[r][c+1])/2,(ys[r]+ys[r+1])/2,'tile-'+i);}}
  if(id===9){for(const x of[2.55,7.45])for(const y of[1.7,2.1,2.5,2.9,3.3,3.7,4.1,4.5,4.9,5.3,5.7])add(0,x,y,'raw-garment');for(const y of[1.7,2.1,2.5,2.9,3.3,3.7,4.1,4.5,4.9,5.3,5.7])add(1,5,y,'inferred-garment');}
  if([10,11].includes(id))patches(0,3,'preview');
  if(id===12){add(0,0,1.5,'A');add(0,1,4,'B');patches(1,2,'isolated');}
  if(id===13){row(0,6,'colour');row(0,2.3,'proxy');row(1,4,'reference');}
  return out;
 },id);
}
