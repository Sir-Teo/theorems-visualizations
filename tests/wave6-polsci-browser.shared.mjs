import fs from 'node:fs';
import assert from 'node:assert/strict';

export async function installPolsciProbe(page){
 await page.addInitScript(()=>{window.__texStrict=true;window.__vizStill=true;const t=new URL(location.href).searchParams.get('qaTheme');if(t)localStorage.setItem('theme',t);});
 await page.route('**/content/polsci/ch07.viz.js',async route=>{
  let source=fs.readFileSync(new URL('../content/polsci/ch07.viz.js',import.meta.url),'utf8');
  source="function nativeProbe(name,p){const z=H[name](p);(window.__polsciModels??={})[name]={parameters:p,result:z};return z;}\n"+source;
  source=source.replace(/memo\(H\.(\w+)\)/g,(_,name)=>`memo(p=>nativeProbe('${name}',p))`);
  source=source.replace(/\b(z|e|current|coupling)=H\.(\w+)\(/g,(_,variable,name)=>`${variable}=nativeProbe('${name}',`);
  assert.equal((source.match(/nativeProbe\(/g)||[]).length,12,'eleven intended model assignments plus probe definition');
  source=source.replace('function facts(s,rows){','function facts(s,rows){s.__polsciFacts=rows;');
  source=source.replace("function bars(s,rows,{maximum=null,scaleLabel='share',seriesLabels=null}={}){","function bars(s,rows,{maximum=null,scaleLabel='share',seriesLabels=null}={}){s.__polsciBars={rows,options:{maximum,scaleLabel,seriesLabels}};");
  await route.fulfill({contentType:'text/javascript',body:source});
 });
 await page.route('**/assets/js/viz/core.js',async route=>{
  let source=fs.readFileSync(new URL('../assets/js/viz/core.js',import.meta.url),'utf8');
  const marker='try { vizFn(instance.api); }';assert.ok(source.includes(marker));
  source=source.replace(marker,`window.__polsciRuntime=instance;
   for(const kind of ['stage','stage3d']){const old=instance.api[kind];instance.api[kind]=(...args)=>{
    const s=old(...args),begin=s.begin.bind(s);s.__kind=kind;
    const reset=()=>{s.__paths=[];s.__polys=[];s.__lines=[];s.__arrows=[];s.__dots=[];s.__rects=[];s.__circles=[];s.__meshes=[];s.__glyphs=[];s.__paintedAxes=null;};reset();
    s.begin=(...a)=>{reset();return begin(...a);};
    if(kind==='stage'){const axes=s.axes.bind(s);s.axes=(...a)=>{s.__paintedAxes={bounds:s.bounds,yticks:s.o.yticks};return axes(...a);};}
    const fillText=s.ctx.fillText.bind(s.ctx);s.ctx.fillText=(str,x,y,...rest)=>{const c=s.ctx,m=c.measureText(String(str)),T=c.getTransform(),d=s.canvas.width/s.W,box=[[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxAscent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxAscent],[x-m.actualBoundingBoxLeft,y-m.actualBoundingBoxDescent],[x+m.actualBoundingBoxRight,y-m.actualBoundingBoxDescent]].map(([u,v])=>[(T.a*u+T.c*v+T.e)/d,(T.b*u+T.d*v+T.f)/d]);s.__glyphs.push({text:String(str),l:Math.min(...box.map(p=>p[0])),r:Math.max(...box.map(p=>p[0])),t:Math.min(...box.map(p=>p[1])),b:Math.max(...box.map(p=>p[1])),dataClip:!!s._clipped,g:s._m?{...s._m}:null});return fillText(str,x,y,...rest);};
    for(const [method,key]of [['path','__paths'],['poly','__polys'],['line','__lines'],['arrow','__arrows'],['dot','__dots']]){const fn=s[method].bind(s);s[method]=(...a)=>{let points,style;if(method==='path'||method==='poly'){points=a[0];style=a[1]||{};}else if(kind==='stage3d'){points=method==='dot'?[a[0]]:[a[0],a[1]];style=a[method==='dot'?1:2]||{};}else{points=method==='dot'?[[a[0],a[1]]]:[[a[0],a[1]],[a[2],a[3]]];style=a[method==='dot'?2:4]||{};}s[key].push({points,style,pixels:points.map(p=>p?(kind==='stage3d'?s.project(p):[s.X(p[0]),s.Y(p[1])]):null)});return fn(...a);};}
    if(kind==='stage'){const circle=s.circle.bind(s);s.circle=(x,y,r,style={})=>{s.__circles.push({x,y,r,style});return circle(x,y,r,style);};const rect=s.rect.bind(s);s.rect=(...a)=>{s.__rects.push({points:[[a[0],a[1]],[a[2],a[3]]],style:a[4]||{}});return rect(...a);};}
    else{const surface=s.surface.bind(s);s.surface=(F,u,w,st={})=>{const mesh={points:[],style:st};s.__meshes.push(mesh);return surface((a,b)=>{const p=F(a,b);mesh.points.push(p);return p;},u,w,st);};}
    return s;
   };}
   ${marker}`);
  await route.fulfill({contentType:'text/javascript',body:source});
 });
}

export async function capturePolsci(page){
 await page.evaluate(async()=>{await document.fonts.ready;window.dispatchEvent(new Event('vizpause'));window.__polsciRuntime.invalidate();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 return page.evaluate(()=>{
  const rt=window.__polsciRuntime,issues=[];if(rt.dead||(window.__vizErrors||[]).length)issues.push({type:'production draw failure',errors:window.__vizErrors});
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
    for(const a of s.__rects){const xs=a.points.map(p=>s.X(p[0])),ys=a.points.map(p=>s.Y(p[1])),pad=a.style.stroke===false?0:(a.style.width??2)/2;if(Math.min(...xs)-pad<g.l-1||Math.max(...xs)+pad>s.W-g.r+1||Math.min(...ys)-pad<g.t-1||Math.max(...ys)+pad>s.H-g.b+1)issues.push({type:'rectangle ink',stage:j,a});}
    for(const a of s.__circles){const x=s.X(a.x),y=s.Y(a.y),rx=Math.abs(a.r*s.sx),ry=Math.abs(a.r*s.sy),pad=a.style.stroke===false?0:(a.style.width??2)/2;if(x-rx-pad<g.l-1||x+rx+pad>s.W-g.r+1||y-ry-pad<g.t-1||y+ry+pad>s.H-g.b+1)issues.push({type:'circle ink',stage:j,a});}
    for(const dot of s.__dots){const p=dot.points[0],x=s.X(p[0]),y=s.Y(p[1]),r=(dot.style.r??4)+1;if(x-r<g.l-1||x+r>s.W-g.r+1||y-r<g.t-1||y+r>s.H-g.b+1)issues.push({type:'marker ink',stage:j,p,r});}
    for(const a of s.__arrows){const P=a.points.map(p=>[s.X(p[0]),s.Y(p[1])]),dx=P[1][0]-P[0][0],dy=P[1][1]-P[0][1],L=Math.hypot(dx,dy);if(L<.5)continue;const u=dx/L,v=dy/L,h=Math.min(a.style.head??9,L*.45),pad=(a.style.width??2)/2,points=[...P,[P[1][0]-u*h-v*h*.45,P[1][1]-v*h+u*h*.45],[P[1][0]-u*h+v*h*.45,P[1][1]-v*h-u*h*.45]];for(const[x,y]of points)if(x-pad<g.l-1||x+pad>s.W-g.r+1||y-pad<g.t-1||y+pad>s.H-g.b+1)issues.push({type:'arrow ink',stage:j,points});}
   }
   return pack({kind:s.__kind,W:s.W,H:s.H,xlog:!!s.o.xlog,ylog:!!s.o.ylog,sx:s.sx,sy:s.sy,bounds:s.bounds,xticks:s.o.xticks,yticks:s.o.yticks,paintedAxes:s.__paintedAxes,paths:s.__paths,polys:s.__polys,lines:s.__lines,arrows:s.__arrows,dots:s.__dots,rects:s.__rects,circles:s.__circles,meshes:s.__meshes,glyphs:s.__glyphs,ledger:s.__polsciLedger,facts:s.__polsciFacts,bars:s.__polsciBars,matrix:s.__polsciMatrix});
  });
  for(const el of document.querySelectorAll('.statement,#idea,#caption,.scope,.viz-readout,.stage-title,.refs-inline')){const b=el.getBoundingClientRect(),cs=getComputedStyle(el),left=b.left+parseFloat(cs.paddingLeft),right=b.right-parseFloat(cs.paddingRight),walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(walk.nextNode()){const node=walk.currentNode;if(node.parentElement.closest('.katex-mathml,annotation,script'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width>1&&(r.left<left-1||r.right>right+1||r.top<b.top-1||r.bottom>b.bottom+1))issues.push({type:'rich ink',text:node.textContent,bounds:[r.left,r.top,r.right,r.bottom],container:[left,b.top,right,b.bottom]});}}
  for(const el of document.querySelectorAll('.katex-display')){const b=el.getBoundingClientRect(),inner=el.querySelector('.katex-html')?.getBoundingClientRect();if(el.scrollWidth>el.clientWidth+1||inner&&(inner.left<b.left-1||inner.right>b.right+1))issues.push({type:'inner math',text:el.textContent});}
  if(document.documentElement.scrollWidth>innerWidth+1)issues.push({type:'page overflow'});
  const state=rt.state.capture(),controls=[...document.querySelectorAll('#viz input[type=range]')].map(e=>({label:e.getAttribute('aria-label'),value:Number(e.value)}));
  const palette=Object.fromEntries(['teal','blue','orange','gold','purple'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--c-'+k).trim()]));
  return{issues,state,controls,stages,palette,models:pack(window.__polsciModels),readout:document.querySelector('.viz-readout')?.innerText,theme:document.documentElement.dataset.theme,drawErrors:[...document.querySelectorAll('.viz-error')].map(e=>e.innerText)};
 });
}

export async function polsciScreenshot(page,file){
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';scrollTo({top:0,behavior:'instant'});});
 const bounds=await page.locator('#viz').evaluate(e=>{const b=e.getBoundingClientRect();return{x:b.x+scrollX,y:b.y+scrollY,width:b.width,height:b.height};});
 await page.screenshot({path:file,clip:bounds,fullPage:true});
 const regions=await page.locator('#viz').evaluate(host=>{const b=host.getBoundingClientRect();return Object.fromEntries(['.viz-stages','.viz-legend','.viz-controls','.viz-readout'].map(selector=>{const r=host.querySelector(selector)?.getBoundingClientRect();return[selector,r?{x:r.x-b.x,y:r.y-b.y,width:r.width,height:r.height}:null];}));});
 fs.writeFileSync(file.replace('.png','.regions.json'),JSON.stringify(regions,null,2)+'\n');
}
